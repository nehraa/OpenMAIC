import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { saveGeneratedContent } from '@/lib/server/library';
import { recordUsage, estimateCost } from '@/lib/server/usage';
import { generateSlideDeck, generateQuiz } from '@/lib/server/ai-providers';
import type { AuthContext } from '@/middleware/auth';
import { z } from 'zod';

const GenerateSchema = z.object({
  type: z.enum(['slide_deck', 'quiz']),
  prompt: z.string().min(1, 'Prompt is required'),
  classId: z.string().optional(),
});

const PROVIDER = 'minimax';
const MODEL = process.env.MINIMAX_MODEL || 'MiniMax-M3';

// POST /api/teacher/library/generate - Generate a slide deck or quiz via MiniMax
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const body = await req.json();

  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { type, prompt, classId } = parsed.data;

  let payload: any;
  let inputTokens = 0;
  let outputTokens = 0;

  try {
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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown AI generation error';
    console.error('[library/generate] AI provider error:', message);
    return NextResponse.json(
      { error: `AI generation failed: ${message}` },
      { status: 502 }
    );
  }

  // Truncate the prompt to make a usable title (model already produced one too,
  // but the prompt is more predictable for the asset title).
  let title = prompt;
  if (title.length > 50) title = title.substring(0, 47) + '...';

  const asset = await saveGeneratedContent({
    tenantId: ctx.tenantId,
    teacherId: ctx.user.id,
    type,
    title,
    payload,
    sourceKind: 'ai_generated',
    subjectTag: 'AI Generated',
  });

  // Record usage for analytics (real provider, real cost).
  const feature = type === 'slide_deck' ? 'slide_generation' : 'quiz_generation';
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

  return NextResponse.json({ asset }, { status: 201 });
});
