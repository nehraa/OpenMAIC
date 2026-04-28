import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { getAssignmentProgress } from '@/lib/server/progress';
import { getDb } from '@/lib/db';

// GET /api/teacher/progress/assignment/[assignmentId] - Get progress for a specific assignment
export const GET = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { assignmentId } = await routeCtx.params;

  // Verify assignment belongs to the teacher
  const db = getDb();
  const assignmentResult = await db.query(`
    SELECT a.id FROM assignments a
    INNER JOIN classes c ON c.id = a.class_id
    WHERE a.id = $1 AND c.teacher_id = $2
  `, [assignmentId, ctx.user.id]);

  if (assignmentResult.rows.length === 0) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  const progress = getAssignmentProgress(assignmentId);

  if (!progress) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  return NextResponse.json({ progress });
});
