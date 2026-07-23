import { type NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/server/middleware';
import {
  advanceClassroomGenerationJob,
  getClassroomGenerationJob,
} from '@/lib/server/classroom-generation-jobs';

// Poll one durable teacher-generation job. Each request advances Core by one
// status check. This survives Next.js route-module isolation and service
// restarts because both the Core handoff and the result live in Postgres.
export const GET = withRole(['teacher'], async (_req: NextRequest, ctx, routeCtx) => {
  const { jobId } = await routeCtx.params;
  let job = await getClassroomGenerationJob(jobId);

  if (!job) {
    return NextResponse.json({ error: 'Job not found or expired', jobId }, { status: 404 });
  }
  if (job.teacherId !== ctx.user.id) {
    return NextResponse.json({ error: 'Job belongs to a different teacher', jobId }, { status: 403 });
  }

  job = await advanceClassroomGenerationJob(job);

  return NextResponse.json({
    jobId,
    status: job.status === 'completing' ? 'pending' : job.status,
    progress: job.progress ?? null,
    step: job.step ?? null,
    message: job.message ?? null,
    scenesGenerated: job.scenesGenerated ?? null,
    totalScenes: job.totalScenes ?? null,
    prompt: job.prompt,
    asset: job.asset ?? null,
    fallback: job.fallback,
    warning: job.warning ?? null,
    error: job.error ?? null,
  });
});
