import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/server/middleware';
import { getJob } from '../../generate/route';

// GET /api/teacher/library/generate-status/[jobId] — poll a generation job.
//
// Returns one of:
//   { jobId, status: 'pending' }                — still running
//   { jobId, status: 'completed', asset }       — done; asset has slides/questions payload
//   { jobId, status: 'failed', error }          — AI provider failed
//   404 — jobId unknown (server restart, or pruned). Client should treat as
//        "lost" and offer to retry.
//   403 — job belongs to a different teacher.
export const GET = withRole(['teacher'], async (req: NextRequest, ctx, routeCtx) => {
  const { jobId } = await routeCtx.params;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json(
      { error: 'Job not found or expired', jobId },
      { status: 404 }
    );
  }

  if (job.teacherId !== ctx.user.id) {
    return NextResponse.json(
      { error: 'Job belongs to a different teacher', jobId },
      { status: 403 }
    );
  }

  return NextResponse.json({
    jobId,
    status: job.status,
    type: job.type,
    prompt: job.prompt,
    asset: job.asset ?? null,
    error: job.error ?? null,
  });
});