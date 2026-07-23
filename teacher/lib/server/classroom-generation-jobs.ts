import { getDb } from '../db';
import { saveGeneratedContent } from './library';
import { recordUsage } from './usage';

export type ClassroomJobStatus = 'pending' | 'completing' | 'completed' | 'failed';

export interface ClassroomGenerationJob {
  id: string;
  tenantId: string;
  teacherId: string;
  prompt: string;
  classId?: string;
  coreJobId: string;
  corePollUrl: string;
  status: ClassroomJobStatus;
  pollFailures: number;
  asset?: unknown;
  fallback: boolean;
  warning?: string;
  error?: string;
  progress?: number;
  step?: string;
  message?: string;
  scenesGenerated?: number;
  totalScenes?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CoreStartResponse {
  jobId?: string;
  pollUrl?: string;
  data?: {
    jobId?: string;
    pollUrl?: string;
  };
}

interface CorePollResponse {
  done?: boolean;
  status?: string;
  error?: string;
  progress?: number;
  step?: string;
  message?: string;
  scenesGenerated?: number;
  totalScenes?: number;
  result?: {
    classroomId?: string;
  };
}

interface JobRow {
  id: string;
  tenant_id: string;
  teacher_id: string;
  prompt: string;
  class_id: string | null;
  core_job_id: string;
  core_poll_url: string;
  status: ClassroomJobStatus;
  poll_failures: number;
  asset: unknown | null;
  fallback: boolean;
  warning: string | null;
  error: string | null;
  created_at: Date;
  updated_at: Date;
}

const CORE_REQUEST_TIMEOUT_MS = 90_000;
const CORE_POLL_TIMEOUT_MS = 30_000;
const MAX_CONSECUTIVE_POLL_FAILURES = 20;

function fromRow(row: JobRow): ClassroomGenerationJob {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    teacherId: row.teacher_id,
    prompt: row.prompt,
    classId: row.class_id ?? undefined,
    coreJobId: row.core_job_id,
    corePollUrl: row.core_poll_url,
    status: row.status,
    pollFailures: row.poll_failures,
    asset: row.asset ?? undefined,
    fallback: row.fallback,
    warning: row.warning ?? undefined,
    error: row.error ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function coreBaseUrl(): string {
  const raw = process.env.CORE_INTERNAL_URL || process.env.OPENMAIC_CORE_URL;
  if (!raw) {
    throw new Error('CORE_INTERNAL_URL is not configured');
  }
  return raw.replace(/\/+$/, '');
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timeout);
  }
}

export async function startCoreClassroomJob(
  prompt: string,
  requirements?: string,
): Promise<{ coreJobId: string; corePollUrl: string }> {
  const url = `${coreBaseUrl()}/api/generate-classroom`;
  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requirement: prompt,
        ...(requirements ? { requirements } : {}),
      }),
    },
    CORE_REQUEST_TIMEOUT_MS,
  );

  const bodyText = await response.text();
  let body: CoreStartResponse = {};
  try {
    body = JSON.parse(bodyText) as CoreStartResponse;
  } catch {
    throw new Error(`Core returned non-JSON (HTTP ${response.status})`);
  }

  if (!response.ok) {
    throw new Error(`Core rejected generation request (HTTP ${response.status})`);
  }

  const coreJobId = body.jobId ?? body.data?.jobId;
  const corePollUrl = body.pollUrl ?? body.data?.pollUrl;
  if (!coreJobId || !corePollUrl) {
    throw new Error('Core start response is missing jobId or pollUrl');
  }

  return { coreJobId, corePollUrl };
}

export async function createClassroomGenerationJob(input: {
  id: string;
  tenantId: string;
  teacherId: string;
  prompt: string;
  classId?: string;
  coreJobId: string;
  corePollUrl: string;
}): Promise<ClassroomGenerationJob> {
  const db = getDb();
  const result = await db.query<JobRow>(
    `INSERT INTO teacher_classroom_generation_jobs (
       id, tenant_id, teacher_id, prompt, class_id, core_job_id, core_poll_url
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      input.id,
      input.tenantId,
      input.teacherId,
      input.prompt,
      input.classId ?? null,
      input.coreJobId,
      input.corePollUrl,
    ],
  );

  // Bounded retention; terminal rows are only UI polling metadata.
  void db.query(
    `DELETE FROM teacher_classroom_generation_jobs
     WHERE status IN ('completed', 'failed')
       AND created_at < NOW() - INTERVAL '7 days'`,
  ).catch((error) => console.warn('[classroom-jobs] prune failed', error));

  return fromRow(result.rows[0]);
}

export async function getClassroomGenerationJob(id: string): Promise<ClassroomGenerationJob | null> {
  const result = await getDb().query<JobRow>(
    'SELECT * FROM teacher_classroom_generation_jobs WHERE id = $1',
    [id],
  );
  return result.rows[0] ? fromRow(result.rows[0]) : null;
}

async function updateFailed(id: string, error: string): Promise<ClassroomGenerationJob> {
  const result = await getDb().query<JobRow>(
    `UPDATE teacher_classroom_generation_jobs
     SET status = 'failed', error = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, error],
  );
  return fromRow(result.rows[0]);
}

async function recordPollFailure(job: ClassroomGenerationJob, error: string): Promise<ClassroomGenerationJob> {
  const nextFailures = job.pollFailures + 1;
  if (nextFailures >= MAX_CONSECUTIVE_POLL_FAILURES) {
    return updateFailed(job.id, `Core status could not be reached after ${nextFailures} attempts: ${error}`);
  }

  const result = await getDb().query<JobRow>(
    `UPDATE teacher_classroom_generation_jobs
     SET poll_failures = poll_failures + 1, warning = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [job.id, error],
  );
  return fromRow(result.rows[0]);
}

async function resetPollFailures(id: string): Promise<void> {
  await getDb().query(
    `UPDATE teacher_classroom_generation_jobs
     SET poll_failures = 0, warning = NULL, updated_at = NOW()
     WHERE id = $1 AND poll_failures <> 0`,
    [id],
  );
}

async function claimForCompletion(id: string): Promise<ClassroomGenerationJob | null> {
  const result = await getDb().query<JobRow>(
    `UPDATE teacher_classroom_generation_jobs
     SET status = 'completing', updated_at = NOW()
     WHERE id = $1
       AND (
         status = 'pending'
         OR (status = 'completing' AND updated_at < NOW() - INTERVAL '2 minutes')
       )
     RETURNING *`,
    [id],
  );
  return result.rows[0] ? fromRow(result.rows[0]) : null;
}

async function findExistingAsset(teacherId: string, classroomId: string): Promise<unknown | null> {
  const result = await getDb().query(
    `SELECT * FROM content_assets
     WHERE owner_teacher_id = $1 AND source_ref = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [teacherId, `openmaic:${classroomId}`],
  );
  return result.rows[0] ?? null;
}

async function finalizeCompletedJob(
  job: ClassroomGenerationJob,
  classroomId: string,
): Promise<ClassroomGenerationJob> {
  const claimed = await claimForCompletion(job.id);
  if (!claimed) {
    return (await getClassroomGenerationJob(job.id)) ?? job;
  }

  try {
    let asset = await findExistingAsset(job.teacherId, classroomId);
    const createdNewAsset = !asset;
    if (!asset) {
      const title = job.prompt.length > 50 ? `${job.prompt.substring(0, 47)}...` : job.prompt;
      asset = await saveGeneratedContent({
        tenantId: job.tenantId,
        teacherId: job.teacherId,
        type: 'slide_deck',
        title,
        payload: {
          openmaicClassroomId: classroomId,
          prompt: job.prompt,
          generatedAt: new Date().toISOString(),
        },
        sourceKind: 'ai_generated',
        subjectTag: 'OpenMAIC',
        sourceRef: `openmaic:${classroomId}`,
      });
    }

    if (createdNewAsset) {
      await recordUsage({
        tenantId: job.tenantId,
        actorUserId: job.teacherId,
        actorRole: 'teacher',
        provider: 'core',
        model: 'multi-agent',
        endpoint: '/api/teacher/library/generate-classroom',
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0,
        classId: job.classId,
        feature: 'openmaic_classroom_generation',
        requestId: job.id,
      });
    }

    const result = await getDb().query<JobRow>(
      `UPDATE teacher_classroom_generation_jobs
       SET status = 'completed', asset = $2::jsonb, poll_failures = 0,
           warning = NULL, error = NULL, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [job.id, JSON.stringify(asset)],
    );
    return fromRow(result.rows[0]);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save generated classroom';
    return updateFailed(job.id, message);
  }
}

export async function advanceClassroomGenerationJob(
  job: ClassroomGenerationJob,
): Promise<ClassroomGenerationJob> {
  if (job.status === 'completed' || job.status === 'failed') return job;

  // Another request is finalizing this row. Only reclaim if it has been stuck
  // for two minutes; claimForCompletion handles that on a later poll.
  if (job.status === 'completing' && Date.now() - job.updatedAt.getTime() < 120_000) {
    return job;
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(job.corePollUrl, { method: 'GET' }, CORE_POLL_TIMEOUT_MS);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Core status request failed';
    return recordPollFailure(job, message);
  }

  if (response.status === 404) {
    return updateFailed(job.id, `Core generation job ${job.coreJobId} no longer exists`);
  }
  if (!response.ok) {
    return recordPollFailure(job, `Core status returned HTTP ${response.status}`);
  }

  let body: CorePollResponse;
  try {
    body = (await response.json()) as CorePollResponse;
  } catch {
    return recordPollFailure(job, 'Core status returned non-JSON');
  }

  await resetPollFailures(job.id);

  if (!body.done) {
    const nextProgress = typeof body.progress === 'number'
      ? Math.min(100, Math.max(0, body.progress))
      : undefined;
    // Core is the source of truth, but never let a Core retry visibly regress
    // the bar — clamp to the high-water mark.
    const monotonicProgress = nextProgress === undefined
      ? job.progress
      : Math.max(job.progress ?? 0, nextProgress);
    return {
      ...job,
      pollFailures: 0,
      warning: undefined,
      progress: monotonicProgress,
      step: typeof body.step === 'string' ? body.step : undefined,
      message: typeof body.message === 'string' ? body.message : undefined,
      scenesGenerated: typeof body.scenesGenerated === 'number' ? body.scenesGenerated : undefined,
      totalScenes: typeof body.totalScenes === 'number' ? body.totalScenes : undefined,
    };
  }

  if (body.status === 'failed') {
    return updateFailed(job.id, body.error || 'Core reported generation failed');
  }

  const classroomId = body.result?.classroomId;
  if (!classroomId) {
    return updateFailed(job.id, 'Core completed without a classroomId');
  }

  return finalizeCompletedJob(job, classroomId);
}
