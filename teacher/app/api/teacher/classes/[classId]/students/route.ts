import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/middleware/auth';

// GET /api/teacher/classes/[classId]/students - List enrolled students
export const GET = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { classId } = await routeCtx.params;
  const db = getDb();

  const classResult = await db.query('SELECT id FROM classes WHERE id = $1 AND teacher_id = $2', [classId, ctx.user.id]);
  if (classResult.rows.length === 0) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  const studentsResult = await db.query(`
    SELECT u.id, u.name, u.phone_e164, cm.enrolled_at, cm.source
    FROM users u
    JOIN class_memberships cm ON u.id = cm.student_id
    WHERE cm.class_id = $1
    ORDER BY cm.enrolled_at DESC
  `, [classId]);

  return NextResponse.json({ students: studentsResult.rows });
});

// POST /api/teacher/classes/[classId]/students - Add student by phone
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { classId } = await routeCtx.params;
  const { phone, name } = await req.json();

  if (!phone) {
    return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
  }

  if (!/^\+[1-9]\d{1,14}$/.test(phone)) {
    return NextResponse.json({ error: 'Invalid phone format' }, { status: 400 });
  }

  const db = getDb();

  const classResult = await db.query('SELECT id FROM classes WHERE id = $1 AND teacher_id = $2', [classId, ctx.user.id]);
  if (classResult.rows.length === 0) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  // Check if student exists
  const existingStudentResult = await db.query(
    'SELECT * FROM users WHERE phone_e164 = $1 AND role = $2',
    [phone, 'student_classroom']
  );

  let student;
  if (existingStudentResult.rows.length > 0) {
    student = existingStudentResult.rows[0];
  } else {
    // Create new student
    const insertResult = await db.query(
      `INSERT INTO users (role, phone_e164, name) VALUES ($1, $2, $3) RETURNING *`,
      ['student_classroom', phone, name?.trim() || '']
    );
    student = insertResult.rows[0];
  }

  // Check if already enrolled
  const existingMembershipResult = await db.query(
    'SELECT id FROM class_memberships WHERE class_id = $1 AND student_id = $2',
    [classId, student.id]
  );
  if (existingMembershipResult.rows.length > 0) {
    return NextResponse.json({ error: 'Student already enrolled' }, { status: 409 });
  }

  // Create membership
  const membershipResult = await db.query(
    `INSERT INTO class_memberships (class_id, student_id, source) VALUES ($1, $2, 'manual') RETURNING *`,
    [classId, student.id]
  );

  return NextResponse.json({
    membership: membershipResult.rows[0],
    student: { id: student.id, name: student.name, phone_e164: student.phone_e164 }
  }, { status: 201 });
});
