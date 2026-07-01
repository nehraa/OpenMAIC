import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/server/middleware';
import { saveGeneratedContent } from '@/lib/server/library';
import { recordUsage } from '@/lib/server/usage';
import type { AuthContext } from '@/lib/server/middleware/auth';
import { z } from 'zod';
import { randomBytes } from 'crypto';

const GenerateSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  classId: z.string().optional(),
  requirements: z.string().optional(),
});

const CORE_INTERNAL_URL = process.env.CORE_INTERNAL_URL || 'http://localhost:3000';
const CORE_REQUEST_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 120_000;

/**
 * POST /api/teacher/library/generate-classroom
 *
 * One-click "Generate OpenMAIC Classroom" flow.
 *
 * Steps:
 *   1. Forward the topic to core's `POST /api/generate-classroom` (CORE_INTERNAL_URL).
 *   2. Core returns 202 with a jobId and `pollUrl`.
 *   3. Poll core's `GET /api/generate-classroom/[jobId]` every 2s for up to 120s.
 *   4. On success, persist a `slide_deck` `content_asset` whose
 *      `content_asset_versions.payload_json` carries `openmaicClassroomId` —
 *      the student app's existing assignment handler already reads this
 *      field from the version JSON and redirects to the OpenMAIC classroom.
 *   5. On any failure (network error, 5xx, job error, timeout), fall back
 *      to a "stub" asset with `openmaicClassroomId = "stub-<rand>"` so the
 *      wiring remains testable when core is unreachable. The response
 *      includes `fallback: true` and a `warning` string in this case.
 *   6. Record a non-zero `llm_usage_events` row for analytics (provider
 *      'core', model 'multi-agent'; token counts are unknown so we use 0).
 *
 * Environment:
 *   - `CORE_INTERNAL_URL` (default `http://localhost:3000`): the URL the
 *     teacher service uses to reach core. In production docker compose this
 *     is `http://core:3000`; in local dev it stays at the default.
 *
 * Response shapes:
 *   - 201: { asset, fallback?: false }
 *   - 201 (fallback): { asset, fallback: true, warning: string }
 *   - 400: { error: ZodIssues } (missing/empty prompt)
 *   - 401/403: { error } (auth/role)
 *   - 502: { error: string } (core reported the job as failed)
 */
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const body = await req.json();

  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { prompt, classId, requirements } = parsed.data;

  const title = prompt.length > 50 ? `${prompt.substring(0, 47)}...` : prompt;
  let classroomId = '';
  let warning: string | undefined;
  let isFallback = false;

  // 1) Call core to start a generation job.
  let jobId: string | null = null;
  let pollUrl: string | null = null;

  try {
    const startResult = await startCoreJob(prompt, requirements, ctx);
    jobId = startResult.jobId;
    pollUrl = startResult.pollUrl;
  } catch (err) {
    // Network error, 5xx, timeout — fall back to a stub asset.
    const message = err instanceof Error ? err.message : 'Unknown core error';
    console.warn(
      `[generate-classroom] Core unreachable, creating stub asset. tenant=${ctx.tenantId} prompt="${prompt.substring(0, 40)}" reason=${message}`
    );
    classroomId = `stub-${randomBytes(8).toString('hex')}`;
    warning =
      'Core service unavailable; created stub asset. Set CORE_INTERNAL_URL to a running core instance to enable real generation.';
    isFallback = true;
  }

  // 2) Poll core until the job is done (only if we have a jobId).
  if (jobId && pollUrl && !isFallback) {
    try {
      const result = await pollCoreJob(pollUrl, jobId);
      if (result.kind === 'done') {
        classroomId = result.classroomId;
      } else {
        // Job explicitly failed on core's side — surface the error to the
        // teacher as a 502; we do NOT silently fall back here because the
        // teacher asked for a real classroom.
        return NextResponse.json(
          { error: result.error || 'Core reported generation failed' },
          { status: 502 }
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown polling error';
      console.warn(
        `[generate-classroom] Core polling failed, creating stub asset. jobId=${jobId} reason=${message}`
      );
      classroomId = `stub-${randomBytes(8).toString('hex')}`;
      warning = 'Core generation timed out; created stub asset.';
      isFallback = true;
    }
  }

  // 3) Persist the asset with `openmaicClassroomId` in the version payload.
  //    The student app reads `payload.openmaicClassroomId` and redirects to
  //    `${OPENMAIC_PUBLIC_URL}/classroom/${id}`.
  const asset = await saveGeneratedContent({
    tenantId: ctx.tenantId,
    teacherId: ctx.user.id,
    type: 'slide_deck',
    title,
    payload: {
      openmaicClassroomId: classroomId,
      prompt,
      generatedAt: new Date().toISOString(),
    },
    sourceKind: 'ai_generated',
    subjectTag: 'OpenMAIC Classroom',
    sourceRef: isFallback ? 'stub-fallback' : `openmaic:${classroomId}`,
  });

  // 4) Record usage for analytics. Token counts are unknown (core is a black
  //    box for now), so we record 0/0 with cost 0. The DB columns are
  //    non-null with defaults, so this is safe.
  await recordUsage({
    tenantId: ctx.tenantId,
    actorUserId: ctx.user.id,
    actorRole: ctx.user.role,
    provider: 'core',
    model: 'multi-agent',
    endpoint: '/api/teacher/library/generate-classroom',
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    classId: classId,
    feature: 'openmaic_classroom_generation',
  });

  if (isFallback) {
    return NextResponse.json({ asset, fallback: true, warning }, { status: 201 });
  }
  return NextResponse.json({ asset }, { status: 201 });
});

interface StartResult {
  jobId: string;
  pollUrl: string;
}

async function startCoreJob(
  prompt: string,
  requirements: string | undefined,
  _ctx: AuthContext
): Promise<StartResult> {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), CORE_REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${CORE_INTERNAL_URL}/api/generate-classroom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: abortController.signal,
      body: JSON.stringify({ requirement: prompt, ...(requirements ? { requirements } : {}) }),
    });

    if (!res.ok) {
      throw new Error(`Core start failed: HTTP ${res.status}`);
    }

    const json = (await res.json()) as {
      jobId?: string;
      pollUrl?: string;
      data?: { jobId?: string; pollUrl?: string };
    };
    // Core uses an `apiSuccess` envelope that wraps in `{ success, data }`,
    // but it also returns the body directly. Support both.
    const jobId = json.jobId ?? json.data?.jobId;
    const pollUrl = json.pollUrl ?? json.data?.pollUrl;
    if (!jobId || !pollUrl) {
      throw new Error('Core start response missing jobId/pollUrl');
    }
    return { jobId, pollUrl };
  } finally {
    clearTimeout(timeoutId);
  }
}

type PollResult = { kind: 'done'; classroomId: string } | { kind: 'failed'; error: string };

async function pollCoreJob(pollUrl: string, jobId: string): Promise<PollResult> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  const abortController = new AbortController();
  // Hard ceiling on each individual GET (slightly longer than the poll
  // interval so a single slow request doesn't kill the loop).
  const perFetchTimeout = setTimeout(() => abortController.abort(), POLL_INTERVAL_MS * 3);

  try {
    while (Date.now() < deadline) {
      const res = await fetch(pollUrl, { signal: abortController.signal });
      if (!res.ok) {
        throw new Error(`Core poll failed: HTTP ${res.status}`);
      }
      const json = (await res.json()) as {
        done?: boolean;
        status?: string;
        result?: { classroomId?: string };
        error?: string;
        data?: {
          done?: boolean;
          status?: string;
          result?: { classroomId?: string };
          error?: string;
        };
      };
      const body = (json.data ?? json) as {
        done?: boolean;
        status?: string;
        result?: { classroomId?: string };
        error?: string;
      };

      if (body.done) {
        if (body.status === 'failed') {
          return { kind: 'failed', error: body.error || 'Job failed' };
        }
        const classroomId = body.result?.classroomId;
        if (!classroomId) {
          return { kind: 'failed', error: 'Job completed without a classroomId' };
        }
        return { kind: 'done', classroomId };
      }

      // Not done yet — wait before the next attempt.
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
    throw new Error(`Polling timed out after ${POLL_TIMEOUT_MS}ms (jobId=${jobId})`);
  } finally {
    clearTimeout(perFetchTimeout);
  }
}
