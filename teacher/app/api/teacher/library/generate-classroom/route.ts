import { type NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { withRole } from '@/lib/server/middleware';
import {
  createClassroomGenerationJob,
  startCoreClassroomJob,
} from '@/lib/server/classroom-generation-jobs';

export const maxDuration = 90;

const GenerateSchema = z.object({
  prompt: z.string().trim().min(1, 'Prompt is required'),
  classId: z.string().optional(),
  requirements: z.string().optional(),
});

// Start the Core job synchronously, persist the teacher-side handoff, and
// return immediately. The status route advances Core polling one request at a
// time, so no long Cloudflare request and no in-memory job map are involved.
export const POST = withRole(['teacher'], async (req: NextRequest, ctx) => {
  const parsed = GenerateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { prompt, classId, requirements } = parsed.data;
  let coreJob: { coreJobId: string; corePollUrl: string };
  try {
    coreJob = await startCoreClassroomJob(prompt, requirements);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Core generation could not be started';
    console.error(
      `[generate-classroom] start failed tenant=${ctx.tenantId} teacher=${ctx.user.id}: ${message}`,
    );
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const jobId = randomBytes(12).toString('hex');
  await createClassroomGenerationJob({
    id: jobId,
    tenantId: ctx.tenantId,
    teacherId: ctx.user.id,
    prompt,
    classId,
    coreJobId: coreJob.coreJobId,
    corePollUrl: coreJob.corePollUrl,
  });

  console.log(
    `[generate-classroom] queued teacherJob=${jobId} coreJob=${coreJob.coreJobId} tenant=${ctx.tenantId}`,
  );
  return NextResponse.json({ jobId, status: 'pending' as const }, { status: 202 });
});
