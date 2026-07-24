import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '../../../../../middleware';
import { getJob } from '../../generate/route';

// GET /api/teacher/library/generate-status/[jobId] — poll a generation job.
//
// Returns one of:
//   { jobId, status: 'pending', progress, step, message, scenesGenerated,
//     totalScenes, log }                              — still running
//   { jobId, status: 'completed', asset, log }        — done; asset has
//     openmaicClassroomId for slides
//   { jobId, status: 'failed', error, log }           — generation failed
//   404 — jobId unknown (server restart, or pruned). Client should treat as
//        "lost" and offer to retry.
//
// `log` is included so the teacher UI can expand and read the trail when
// something goes sideways — without it, all you see is a "Failed" toast
// with no clue what stage died.
export const GET = withRole(['teacher'], async (req: NextRequest, ctx, routeCtx) => {
  const { jobId } = await routeCtx.params;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json(
      { error: 'Job not found or expired', jobId },
      { status: 404 }
    );
  }

  // Don't leak another teacher's job. Jobs are keyed by random id so this
  // is mostly belt-and-suspenders, but if a job id ever leaks (logs,
  // browser history) we don't want a different teacher reading it.
  if (job.teacherId !== ctx.user.id) {
    return NextResponse.json({ error: 'Job not found', jobId }, { status: 404 });
  }

  return NextResponse.json({
    jobId,
    status: job.status,
    type: job.type,
    prompt: job.prompt,
    asset: job.asset ?? null,
    mockContent: job.mockContent ?? false,
    error: job.error ?? null,
    progress: job.progress ?? 0,
    step: job.step ?? 'queued',
    message: job.message ?? 'Queued',
    scenesGenerated: job.scenesGenerated ?? 0,
    totalScenes: job.totalScenes ?? 0,
    coreJobId: job.coreJobId ?? null,
    log: job.log ?? [],
  });
});
