import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { generateQuizFromSlides, createQuiz, addQuestion } from '@/lib/server/quizzes';
import { recordUsage, estimateCost } from '@/lib/server/usage';
import { z } from 'zod';

const GenerateFromSlidesSchema = z.object({
  slideAssetVersionId: z.string().min(1, 'Slide asset version ID is required'),
  title: z.string().min(1, 'Title is required').optional(),
  classId: z.string().optional(),
});

const PROVIDER = 'mock';
const MODEL = 'mock-gpt-4o-mini';

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// POST /api/teacher/quizzes/generate-from-slides - Generate quiz from slides
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const body = await req.json();

  const parsed = GenerateFromSlidesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { slideAssetVersionId, title, classId } = parsed.data;

  // Estimate tokens from the slide content
  const { getDb } = await import('@/lib/db');
  const db = getDb();
  const versionResult = await db.query('SELECT payload_json FROM content_asset_versions WHERE id = $1', [slideAssetVersionId]);
  const slideText = versionResult.rows[0]?.payload_json || '';
  const inputTokens = estimateTokens(slideText) + 100; // system prompt overhead

  const questions = await generateQuizFromSlides(slideAssetVersionId);

  const outputText = JSON.stringify(questions);
  const outputTokens = estimateTokens(outputText);

  const quizTitle = title || `Quiz from slides (${new Date().toLocaleDateString()})`;
  const quiz = await createQuiz({
    title: quizTitle,
    teacherId: ctx.user.id,
    subjectTag: 'auto-generated'
  });

  for (const question of questions) {
    await addQuestion(quiz.id, {
      type: question.type,
      question: question.question,
      options: question.options,
      correctIndex: question.correctIndex,
      sampleAnswer: question.sampleAnswer,
      points: question.points
    });
  }

  // Record usage for analytics
  await recordUsage({
    tenantId: ctx.tenantId,
    actorUserId: ctx.user.id,
    actorRole: ctx.user.role,
    provider: PROVIDER,
    model: MODEL,
    endpoint: '/api/teacher/quizzes/generate-from-slides',
    inputTokens,
    outputTokens,
    costUsd: estimateCost(MODEL + '-mock', inputTokens, outputTokens),
    classId: classId,
    feature: 'quiz_generation',
  });

  return NextResponse.json({
    quiz,
    questions,
    generatedCount: questions.length
  }, { status: 201 });
});
