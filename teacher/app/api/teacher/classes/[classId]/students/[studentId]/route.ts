import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';

interface RouteParams {
  params: Promise<{ classId: string; studentId: string }>;
}

// DELETE /api/teacher/classes/[classId]/students/[studentId] - Remove student from class
export const DELETE = withRole(['teacher'], async (req: NextRequest, ctx: any, { params }: RouteParams) => {
  const { classId, studentId } = await params;
  const db = getDb();

  // Verify ownership
  const classData = db.prepare('SELECT id FROM classes WHERE id = ? AND teacher_id = ?').get(classId, ctx.user.id);
  if (!classData) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  // Remove membership
  const result = db.prepare('DELETE FROM class_memberships WHERE class_id = ? AND student_id = ?').run(classId, studentId);

  if (result.changes === 0) {
    return NextResponse.json({ error: 'Student not enrolled in this class' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});
