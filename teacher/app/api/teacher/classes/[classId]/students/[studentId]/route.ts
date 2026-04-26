import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/middleware/auth';

// DELETE /api/teacher/classes/[classId]/students/[studentId] - Remove student from class
export const DELETE = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const pathParts = req.nextUrl.pathname.split('/').filter(Boolean);
  const studentId = pathParts[pathParts.length - 1];
  const classId = pathParts[pathParts.length - 3];
  const db = getDb();

  const classData = db.prepare('SELECT id FROM classes WHERE id = ? AND teacher_id = ?').get(classId, ctx.user.id);
  if (!classData) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  const result = db.prepare('DELETE FROM class_memberships WHERE class_id = ? AND student_id = ?').run(classId, studentId);

  if (result.changes === 0) {
    return NextResponse.json({ error: 'Student not enrolled in this class' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});
