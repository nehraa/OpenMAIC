import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import {
  createScheduleJob,
  getSchedule,
  updateSchedule
} from '@/lib/server/scheduler';
import { getAssignmentById } from '@/lib/server/assignments';

// POST /api/teacher/assignments/[assignmentId]/schedule - Create or update schedule
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { assignmentId } = await routeCtx.params;

  const assignment = await getAssignmentById(assignmentId);
  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  if (assignment.teacher_id !== ctx.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  if (assignment.status === 'released' || assignment.status === 'closed') {
    return NextResponse.json(
      { error: `Cannot schedule assignment with status '${assignment.status}'` },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const { releaseAt } = body;

    if (!releaseAt) {
      return NextResponse.json({ error: 'releaseAt is required' }, { status: 400 });
    }

    const releaseDate = new Date(releaseAt);
    if (isNaN(releaseDate.getTime())) {
      return NextResponse.json({ error: 'Invalid releaseAt date format' }, { status: 400 });
    }

    const job = await updateSchedule(assignmentId, releaseAt);

    return NextResponse.json({
      scheduled: true,
      releaseAt: job.run_at,
      jobId: job.id
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
});

// GET /api/teacher/assignments/[assignmentId]/schedule - Get schedule
export const GET = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { assignmentId } = await routeCtx.params;

  const assignment = await getAssignmentById(assignmentId);
  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  if (assignment.teacher_id !== ctx.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const schedule = await getSchedule(assignmentId);

  if (!schedule) {
    return NextResponse.json({ scheduled: false, releaseAt: null });
  }

  return NextResponse.json({
    scheduled: true,
    releaseAt: schedule.run_at,
    status: schedule.status,
    jobId: schedule.id
  });
});
