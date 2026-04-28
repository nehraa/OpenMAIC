import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/middleware/auth';

// DELETE /api/teacher/classes/[classId]/students/[studentId] - Remove student from class
export const DELETE = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { classId, studentId } = await routeCtx.params;
  const db = getDb();

  const classResult = await db.query('SELECT id FROM classes WHERE id = $1 AND teacher_id = $2', [classId, ctx.user.id]);
  if (classResult.rows.length === 0) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  const deleteResult = await db.query('DELETE FROM class_memberships WHERE class_id = $1 AND student_id = $2 RETURNING id', [classId, studentId]);

  if (deleteResult.rows.length === 0) {
    return NextResponse.json({ error: 'Student not enrolled in this class' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});
