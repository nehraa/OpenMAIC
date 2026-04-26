import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';

interface RouteParams {
  params: Promise<{ classId: string }>;
}

// GET /api/teacher/classes/[classId]/students - List enrolled students
export const GET = withRole(['teacher'], async (req: NextRequest, ctx: any, { params }: RouteParams) => {
  const { classId } = await params;
  const db = getDb();

  // Verify ownership
  const classData = db.prepare('SELECT id FROM classes WHERE id = ? AND teacher_id = ?').get(classId, ctx.user.id);
  if (!classData) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  const students = db.prepare(`
    SELECT u.id, u.name, u.phone_e164, cm.enrolled_at, cm.source
    FROM users u
    JOIN class_memberships cm ON u.id = cm.student_id
    WHERE cm.class_id = ?
    ORDER BY cm.enrolled_at DESC
  `).all(classId);

  return NextResponse.json({ students });
});

// POST /api/teacher/classes/[classId]/students - Add student by phone
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: any, { params }: RouteParams) => {
  const { classId } = await params;
  const { phone, name } = await req.json();

  if (!phone) {
    return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
  }

  // Validate E.164
  if (!/^\+[1-9]\d{1,14}$/.test(phone)) {
    return NextResponse.json({ error: 'Invalid phone format' }, { status: 400 });
  }

  const db = getDb();

  // Verify ownership
  const classData = db.prepare('SELECT id FROM classes WHERE id = ? AND teacher_id = ?').get(classId, ctx.user.id);
  if (!classData) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  // Find or create student
  let student = db.prepare('SELECT * FROM users WHERE phone_e164 = ? AND role = ?').get(phone, 'student_classroom') as any;

  if (!student) {
    const result = db.prepare(`
      INSERT INTO users (role, phone_e164, name)
      VALUES ('student_classroom', ?, ?)
    `).run(phone, name?.trim() || '');
    student = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  }

  // Check if already enrolled
  const existing = db.prepare('SELECT id FROM class_memberships WHERE class_id = ? AND student_id = ?').get(classId, student.id);
  if (existing) {
    return NextResponse.json({ error: 'Student already enrolled' }, { status: 409 });
  }

  // Create membership
  const result = db.prepare(`
    INSERT INTO class_memberships (class_id, student_id, source)
    VALUES (?, ?, 'manual')
  `).run(classId, student.id);

  const membership = db.prepare('SELECT * FROM class_memberships WHERE id = ?').get(result.lastInsertRowid);

  return NextResponse.json({
    membership,
    student: {
      id: student.id,
      name: student.name,
      phone_e164: student.phone_e164
    }
  }, { status: 201 });
});
