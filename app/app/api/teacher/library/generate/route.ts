import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '../../../../middleware';
import { saveGeneratedContent } from '../../../../lib/server/library';
import type { AuthContext } from '../../../../middleware/auth';
import { toPublicClassroomUrl } from '../../../../lib/server/classroom-url';
import { z } from 'zod';
import { randomBytes } from 'crypto';

// POST returns immediately. Long-running generation runs detached, so the
// edge proxy (Cloudflare etc.) won't cut the response off mid-flight —
// previously this caused the browser's JSON.parse to fail with
// "unexpected character" when Cloudflare returned an HTML error page
// after a 100s+ wait.
export const maxDuration = 60;

const GenerateSchema = z.object({
  type: z.enum(['slide_deck', 'quiz']),
  prompt: z.string().min(1, 'Prompt is required'),
});

export type JobStatus = 'pending' | 'completed' | 'failed';

export interface JobLogEntry {
  ts: number;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface JobState {
  status: JobStatus;
  teacherId: string;
  tenantId: string;
  type: 'slide_deck' | 'quiz';
  prompt: string;
  asset?: unknown;
  mockContent?: boolean;
  error?: string;
  createdAt: number;
  // Progress + log are populated as the runJob poller observes the upstream
  // OpenMAIC core job. The status endpoint returns them so the toast in the
  // teacher UI can show a real bar (scenes N/M) instead of an indefinite
  // spinner. Log entries are appended monotonically; the UI shows the most
  // recent ones when something goes sideways.
  progress: number; // 0-100
  step: string;
  message: string;
  scenesGenerated: number;
  totalScenes: number;
  coreJobId?: string;
  log: JobLogEntry[];
}

const MAX_LOG_ENTRIES = 100;

// ponytail: single-process Map is fine for one teacher's own jobs. Switch
// to a DB-backed job table when this app becomes multi-instance.
//
// Pinned to globalThis so the POST handler and the GET status handler share
// the same Map across module instances — see the matching comment in
// teacher/app/api/teacher/library/generate/route.ts for why this matters in
// dev mode (otherwise the GET always 404s immediately after a POST).
type GlobalWithJobs = typeof globalThis & {
  __openmaic_appGenerateJobs?: Map<string, JobState>;
};
const globalRef = globalThis as GlobalWithJobs;
const jobs: Map<string, JobState> =
  globalRef.__openmaic_appGenerateJobs ?? (globalRef.__openmaic_appGenerateJobs = new Map());

export function getJob(jobId: string): JobState | undefined {
  return jobs.get(jobId);
}

function appendLog(job: JobState, level: JobLogEntry['level'], message: string): void {
  job.log.push({ ts: Date.now(), level, message });
  if (job.log.length > MAX_LOG_ENTRIES) {
    job.log.splice(0, job.log.length - MAX_LOG_ENTRIES);
  }
}

// Cap memory under long uptimes; prune oldest completed/failed jobs first.
const MAX_JOBS = 500;
function pruneOldJobs() {
  if (jobs.size <= MAX_JOBS) return;
  const sorted = [...jobs.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt);
  const toRemove = sorted.slice(0, jobs.size - MAX_JOBS);
  for (const [id] of toRemove) jobs.delete(id);
}

async function generateOpenMAICClassroom(
  requirement: string,
  baseUrl: string,
  timeoutMs: number,
  onUpdate: (update: {
    jobId: string;
    progress: number;
    step: string;
    message: string;
    scenesGenerated: number;
    totalScenes: number;
  }) => void
): Promise<{ classroomId: string; url: string; jobId: string }> {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);
  try {
    const createRes = await fetch(`${baseUrl}/api/generate-classroom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: abortController.signal,
      body: JSON.stringify({ requirement }),
    });
    if (!createRes.ok) {
      throw new Error(`OpenMAIC generation failed: ${createRes.statusText}`);
    }

    const created = (await createRes.json()) as { jobId: string; pollUrl: string };
    onUpdate({
      jobId: created.jobId,
      progress: 1,
      step: 'queued',
      message: 'Queued at the classroom engine',
      scenesGenerated: 0,
      totalScenes: 0,
    });

    const maxAttempts = Math.max(1, Math.floor((timeoutMs - 5000) / 5000));
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const pollRes = await fetch(created.pollUrl, { signal: abortController.signal });
      if (!pollRes.ok) {
        throw new Error(`Polling failed: ${pollRes.statusText}`);
      }

      // Core's API wraps payloads as { success, data, ... } — but its
      // /api/generate-classroom/:jobId returns the job fields at the top
      // level (no envelope). Be defensive either way.
      const raw = (await pollRes.json()) as Record<string, unknown>;
      const job = (raw.data as Record<string, unknown> | undefined) ?? raw;

      onUpdate({
        jobId: String(job.jobId ?? created.jobId),
        progress: Number(job.progress ?? 0),
        step: String(job.step ?? 'running'),
        message: String(job.message ?? 'Working...'),
        scenesGenerated: Number(job.scenesGenerated ?? 0),
        totalScenes: Number(job.totalScenes ?? 0),
      });

      if (job.done || job.status === 'succeeded' || job.status === 'failed') {
        if (job.status === 'failed') {
          throw new Error(String(job.error ?? 'Generation failed'));
        }
        const result = (job.result as { classroomId?: string; url?: string } | undefined) ?? {};
        if (!result.classroomId || !result.url) {
          throw new Error('Generation finished but did not return a classroom link');
        }
        return { classroomId: result.classroomId, url: result.url, jobId: String(job.jobId ?? created.jobId) };
      }
    }
    throw new Error('Generation timed out');
  } finally {
    clearTimeout(timeoutId);
  }
}

const FALLBACK_ERROR_PATTERNS = [
  'API key required',
  'OPENAI_API_KEY',
  'Invalid API key',
  'usage limit exceeded',
  'token plan',
  'taking too long',
];

function shouldUseMockFallback(errMsg: string): boolean {
  return FALLBACK_ERROR_PATTERNS.some(p => errMsg.includes(p));
}

function buildMockSlides(prompt: string) {
  return {
    slides: [
      { id: 's1', title: `Introduction to ${prompt}`, content: `Intro slide about ${prompt}.`, bullets: ['Basics', 'Terminology', 'Applications'] },
      { id: 's2', title: `Core Concepts of ${prompt}`, content: `Fundamental concepts.`, bullets: ['Principle 1', 'Principle 2', 'Principle 3'] },
      { id: 's3', title: `Understanding ${prompt}`, content: `Deeper look.`, bullets: ['Context', 'Relevance', 'Implications'] },
      { id: 's4', title: `Examples of ${prompt}`, content: `Examples.`, bullets: ['Example 1', 'Example 2', 'Example 3'] },
      { id: 's5', title: `Summary: ${prompt}`, content: `Recap.`, bullets: ['Takeaways', 'Reading', 'Practice'] }
    ],
    mockGenerated: true,
    originalPrompt: prompt,
    generatedAt: new Date().toISOString(),
  };
}

function buildMockQuiz(prompt: string) {
  return {
    questions: [
      { id: 'q1', text: `What is the primary focus of ${prompt}?`, options: ['A', 'B', 'C', 'D'], correct: 0 },
      { id: 'q2', text: `Most related to ${prompt}?`, options: ['X', 'Y', 'Z', 'W'], correct: 1 },
      { id: 'q3', text: `${prompt} is significant.`, options: ['True', 'False'], correct: 0 },
      { id: 'q4', text: `Essential element for ${prompt}?`, options: ['1', '2', '3', '4'], correct: 2 },
      { id: 'q5', text: `Misconception about ${prompt}?`, options: ['A', 'B', 'C', 'D'], correct: 3 }
    ]
  };
}

async function performGeneration(
  type: 'slide_deck' | 'quiz',
  prompt: string,
  onProgress: (u: {
    progress: number;
    step: string;
    message: string;
    scenesGenerated: number;
    totalScenes: number;
    coreJobId?: string;
  }) => void
): Promise<{
  payload: Record<string, unknown>;
  sourceRef: string;
  subjectTag: string;
  mockContent: boolean;
}> {
  if (type === 'slide_deck') {
    const openmaicUrl = process.env.OPENMAIC_PUBLIC_URL || process.env.OPENMAIC_BASE_URL || '';
    let classroomId = '';
    let classroomUrl = '';
    try {
      const result = await generateOpenMAICClassroom(prompt, openmaicUrl, 600_000, (u) => {
        onProgress({
          progress: u.progress,
          step: u.step,
          message: u.message,
          scenesGenerated: u.scenesGenerated,
          totalScenes: u.totalScenes,
          coreJobId: u.jobId,
        });
      });
      classroomId = result.classroomId;
      // Core derives the share URL from its incoming request origin, which is
      // `http://127.0.0.1:3003` when the teacher app talks to it via the
      // internal address. Rewrite to the public base so the teacher only ever
      // sees the world-reachable URL.
      classroomUrl = toPublicClassroomUrl(result.url, openmaicUrl);
      return {
        payload: {
          openmaicClassroomId: classroomId,
          openmaicUrl: classroomUrl,
          prompt,
          generatedAt: new Date().toISOString(),
        },
        sourceRef: `openmaic:${classroomId}`,
        subjectTag: 'OpenMAIC',
        mockContent: false,
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      if (shouldUseMockFallback(errMsg)) {
        return {
          payload: buildMockSlides(prompt),
          sourceRef: 'mock-classroom-id',
          subjectTag: 'AI Generated',
          mockContent: true,
        };
      }
      throw err;
    }
  }
  return {
    payload: buildMockQuiz(prompt),
    sourceRef: 'mock-quiz',
    subjectTag: 'AI Generated',
    mockContent: true,
  };
}

async function runJob(jobId: string, ctx: AuthContext): Promise<void> {
  const job = jobs.get(jobId);
  if (!job) return;
  appendLog(job, 'info', `Generation started (type=${job.type})`);
  try {
    const title = job.prompt.length > 50 ? `${job.prompt.substring(0, 47)}...` : job.prompt;
    const result = await performGeneration(job.type, job.prompt, (u) => {
      job.progress = u.progress;
      job.step = u.step;
      job.message = u.message;
      job.scenesGenerated = u.scenesGenerated;
      job.totalScenes = u.totalScenes;
      if (u.coreJobId) job.coreJobId = u.coreJobId;
      appendLog(job, 'info', `[${u.step}] ${u.message} (${u.progress}%)`);
    });
    appendLog(job, 'info', result.mockContent ? 'Engine returned mock content' : `Engine produced classroom ${result.sourceRef}`);
    const asset = await saveGeneratedContent({
      tenantId: ctx.tenantId,
      teacherId: ctx.user.id,
      type: job.type,
      title,
      payload: result.payload,
      sourceKind: 'ai_generated',
      subjectTag: result.subjectTag,
      sourceRef: result.sourceRef,
    });
    job.status = 'completed';
    job.asset = asset;
    job.mockContent = result.mockContent;
    job.progress = 100;
    job.message = 'Saved to library';
    appendLog(job, 'info', 'Saved to library');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    job.status = 'failed';
    job.error = msg;
    appendLog(job, 'error', `Generation failed: ${msg}`);
  } finally {
    pruneOldJobs();
  }
}

// POST /api/teacher/library/generate — kicks off an async generation and
// returns {jobId, status:'pending'} immediately. The previous blocking
// implementation polled core for up to 4 minutes inside the request handler;
// edge timeouts (Cloudflare ~100s) cut those responses off and the browser
// surfaced "JSON.parse: unexpected character" when it tried to parse the
// HTML error page body. Fire-and-forget keeps the response sub-second and
// turns the long-running work into a pollable job.
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const body = await req.json();

  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { type, prompt } = parsed.data;

  const jobId = randomBytes(12).toString('hex');
  jobs.set(jobId, {
    status: 'pending',
    teacherId: ctx.user.id,
    tenantId: ctx.tenantId,
    type,
    prompt,
    createdAt: Date.now(),
    progress: 0,
    step: 'queued',
    message: 'Queued',
    scenesGenerated: 0,
    totalScenes: 0,
    log: [{ ts: Date.now(), level: 'info', message: 'Job queued' }],
  });

  // Detach — do NOT await. Log any unhandled rejection so a crashed runner
  // doesn't go silent.
  void runJob(jobId, ctx).catch(err => {
    const job = jobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = err instanceof Error ? err.message : 'Unknown error';
      appendLog(job, 'error', `Unhandled: ${job.error}`);
    }
    console.error(`[generate] unhandled error in job ${jobId}:`, err);
  });

  return NextResponse.json({ jobId, status: 'pending' as const }, { status: 202 });
});
