import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/server/middleware';
import { saveGeneratedContent } from '@/lib/server/library';
import { recordUsage, estimateCost } from '@/lib/server/usage';
import { generateSlideDeck, generateQuiz } from '@/lib/server/ai-providers';
import type { AuthContext } from '@/lib/server/middleware/auth';
import { z } from 'zod';
import { randomBytes } from 'crypto';

// POST returns immediately. The previous version blocked inside the request
// handler waiting for the AI provider; on Cloudflare's edge runtime that's a
// few seconds of risk per call. Fire-and-forget keeps the response sub-second
// and turns the work into a pollable job, consistent with the generate-classroom
// route and the app/app generate route.
export const maxDuration = 60;

const GenerateSchema = z.object({
  type: z.enum(['slide_deck', 'quiz']),
  prompt: z.string().min(1, 'Prompt is required'),
  classId: z.string().optional(),
});

export type JobStatus = 'pending' | 'completed' | 'failed';

export interface JobState {
  status: JobStatus;
  teacherId: string;
  tenantId: string;
  type: 'slide_deck' | 'quiz';
  prompt: string;
  asset?: unknown;
  error?: string;
  createdAt: number;
}

// ponytail: single-process Map is fine for one teacher's own jobs. Switch
// to a DB-backed job table when this app becomes multi-instance.
//
// Pinned to globalThis so the POST handler and the GET status handler share
// the same Map across module instances — see the matching comment in
// generate-classroom/route.ts for why this matters in dev mode.
type GlobalWithJobs = typeof globalThis & {
  __openmaic_generateJobs?: Map<string, JobState>;
};
const globalRef = globalThis as GlobalWithJobs;
const jobs: Map<string, JobState> =
  globalRef.__openmaic_generateJobs ?? (globalRef.__openmaic_generateJobs = new Map());

export function getJob(jobId: string): JobState | undefined {
  return jobs.get(jobId);
}

const MAX_JOBS = 500;
function pruneOldJobs() {
  if (jobs.size <= MAX_JOBS) return;
  const sorted = [...jobs.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt);
  const toRemove = sorted.slice(0, jobs.size - MAX_JOBS);
  for (const [id] of toRemove) jobs.delete(id);
}

const PROVIDER = 'minimax';
const MODEL = process.env.MINIMAX_MODEL || 'MiniMax-M3';

async function runJob(jobId: string, ctx: AuthContext, classId?: string): Promise<void> {
  const job = jobs.get(jobId);
  if (!job) return;

  try {
    const { type, prompt } = job;

    let payload: { slides?: unknown[] } | { questions?: unknown[] };
    let inputTokens = 0;
    let outputTokens = 0;

    if (type === 'slide_deck') {
      const result = await generateSlideDeck(prompt, { slideCount: 5 });
      payload = { slides: result.payload.slides };
      inputTokens = result.usage.inputTokens;
      outputTokens = result.usage.outputTokens;
    } else {
      const result = await generateQuiz(prompt, { questionCount: 5 });
      payload = { questions: result.payload.questions };
      inputTokens = result.usage.inputTokens;
      outputTokens = result.usage.outputTokens;
    }

    const title = prompt.length > 50 ? `${prompt.substring(0, 47)}...` : prompt;
    const asset = await saveGeneratedContent({
      tenantId: ctx.tenantId,
      teacherId: ctx.user.id,
      type,
      title,
      payload,
      sourceKind: 'ai_generated',
      subjectTag: 'AI Generated',
    });

    const feature = type === 'slide_deck' ? 'slide_generation' : 'quiz_generation';
    try {
      await recordUsage({
        tenantId: ctx.tenantId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        provider: PROVIDER,
        model: MODEL,
        endpoint: `/api/teacher/library/generate`,
        inputTokens,
        outputTokens,
        costUsd: estimateCost(`${PROVIDER}/${MODEL}`, inputTokens, outputTokens),
        classId: classId,
        feature,
      });
    } catch (analyticsErr) {
      console.warn(
        `[library/generate] Failed to record usage analytics (asset=${asset.id})`,
        analyticsErr instanceof Error ? analyticsErr.message : analyticsErr
      );
    }

    job.status = 'completed';
    job.asset = asset;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown AI generation error';
    console.error(`[library/generate] AI provider error: ${message}`);
    job.status = 'failed';
    job.error = `AI generation failed: ${message}`;
  } finally {
    pruneOldJobs();
  }
}

// POST /api/teacher/library/generate — kicks off an async generation and
// returns {jobId, status:'pending'} immediately. Poll via
// GET /api/teacher/library/generate-status/[jobId].
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const body = await req.json();

  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { type, prompt, classId } = parsed.data;

  const jobId = randomBytes(12).toString('hex');
  jobs.set(jobId, {
    status: 'pending',
    teacherId: ctx.user.id,
    tenantId: ctx.tenantId,
    type,
    prompt,
    createdAt: Date.now(),
  });

  void runJob(jobId, ctx, classId).catch(err => {
    console.error(`[library/generate] unhandled error in job ${jobId}:`, err);
  });

  return NextResponse.json({ jobId, status: 'pending' as const }, { status: 202 });
});