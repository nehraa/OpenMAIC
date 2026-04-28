import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { cancelScheduleJob } from '@/lib/server/scheduler';
import { getAssignmentById } from '@/lib/server/assignments';

// DELETE /api/teacher/assignments/[assignmentId]/schedule - Cancel schedule
export const DELETE = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { assignmentId } = await routeCtx.params;

  const assignment = await getAssignmentById(assignmentId);
  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  if (assignment.teacher_id !== ctx.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    const job = await cancelScheduleJob(assignmentId);

    if (!job) {
      return NextResponse.json({ error: 'No pending schedule found' }, { status: 404 });
    }

    return NextResponse.json({
      scheduled: false,
      message: 'Schedule cancelled successfully'
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to cancel schedule' }, { status: 500 });
  }
});
