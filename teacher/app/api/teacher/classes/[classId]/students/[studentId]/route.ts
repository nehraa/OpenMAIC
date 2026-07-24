import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRole } from '@/lib/server/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/lib/server/middleware/auth';

const membershipStatusSchema = z.object({
  status: z.enum(['pending', 'active', 'rejected', 'restricted']),
});

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

// PATCH /api/teacher/classes/[classId]/students/[studentId]
// Body: { status: 'pending' | 'active' | 'rejected' | 'restricted' }
// Used by the teacher to approve / reject self-join requests, or to restrict
// an active student without removing them from the class roster.
export const PATCH = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { classId, studentId } = await routeCtx.params;
  const parsed = membershipStatusSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const db = getDb();
  const classResult = await db.query('SELECT id FROM classes WHERE id = $1 AND teacher_id = $2', [classId, ctx.user.id]);
  if (classResult.rows.length === 0) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  const updateResult = await db.query(
    `UPDATE class_memberships
     SET status = $1
     WHERE class_id = $2 AND student_id = $3
     RETURNING id, status, enrolled_at, source`,
    [parsed.data.status, classId, studentId]
  );

  if (updateResult.rows.length === 0) {
    return NextResponse.json({ error: 'Student not enrolled in this class' }, { status: 404 });
  }

  return NextResponse.json({ membership: updateResult.rows[0] });
});
