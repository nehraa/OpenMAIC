import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/middleware/auth';
import { randomBytes } from 'crypto';

interface RouteContext {
  params: Promise<Record<string, string>>;
}

// Generate unique join code for student
function generateStudentJoinCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

// GET /api/teacher/students - List all students for teacher's classes
export const GET = withRole(['teacher'], async (_req: NextRequest, ctx: AuthContext, _routeCtx: RouteContext) => {
  const db = getDb();

  const result = await db.query(`
    SELECT DISTINCT u.id, u.name, u.phone_e164, u.status, u.created_at,
           c.id as class_id, c.name as class_name,
           cm.enrolled_at
    FROM users u
    JOIN class_memberships cm ON u.id = cm.student_id
    JOIN classes c ON cm.class_id = c.id
    WHERE c.teacher_id = $1 AND u.role = 'student_classroom'
    ORDER BY u.created_at DESC
  `, [ctx.user.id]);

  return NextResponse.json({ students: result.rows });
});

// POST /api/teacher/students - Create a new student and add to class
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, _routeCtx: RouteContext) => {
  const { name, phone, classId } = await req.json();

  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: 'Student name is required' }, { status: 400 });
  }

  if (!phone || phone.trim().length === 0) {
    return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
  }

  if (!classId || classId.trim().length === 0) {
    return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
  }

  const db = getDb();

  // Verify class belongs to teacher
  const classResult = await db.query(
    'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
    [classId, ctx.user.id]
  );
  if (classResult.rows.length === 0) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  // Check if student with this phone already exists
  const existingStudentResult = await db.query(
    'SELECT id FROM users WHERE phone_e164 = $1 AND role = $2',
    [phone.trim(), 'student_classroom']
  );

  let studentId: string;
  let isNewStudent = false;

  if (existingStudentResult.rows.length > 0) {
    // Use existing student
    studentId = existingStudentResult.rows[0].id;
  } else {
    // Create new student
    isNewStudent = true;
    const joinCode = generateStudentJoinCode();
    const insertResult = await db.query(`
      INSERT INTO users (role, phone_e164, name, status)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, ['student_classroom', phone.trim(), name.trim(), 'active']);
    studentId = insertResult.rows[0].id;
  }

  // Check if already enrolled in this class
  const existingMembershipResult = await db.query(
    'SELECT id FROM class_memberships WHERE class_id = $1 AND student_id = $2',
    [classId, studentId]
  );

  if (existingMembershipResult.rows.length > 0) {
    return NextResponse.json({ error: 'Student is already enrolled in this class' }, { status: 409 });
  }

  // Create class membership
  await db.query(`
    INSERT INTO class_memberships (class_id, student_id, source)
    VALUES ($1, $2, 'manual')
  `, [classId, studentId]);

  // Get the student with membership info
  const studentResult = await db.query(`
    SELECT u.id, u.name, u.phone_e164, u.status, u.created_at,
           c.id as class_id, c.name as class_name, c.join_code
    FROM users u
    JOIN class_memberships cm ON u.id = cm.student_id
    JOIN classes c ON cm.class_id = c.id
    WHERE u.id = $1 AND c.id = $2
  `, [studentId, classId]);

  return NextResponse.json({
    student: studentResult.rows[0],
    isNewStudent
  }, { status: 201 });
});
