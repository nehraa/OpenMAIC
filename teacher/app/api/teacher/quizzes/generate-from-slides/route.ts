import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { generateQuizFromSlides, createQuiz, addQuestion } from '@/lib/server/quizzes';
import { z } from 'zod';

const GenerateFromSlidesSchema = z.object({
  slideAssetVersionId: z.string().min(1, 'Slide asset version ID is required'),
  title: z.string().min(1, 'Title is required').optional()
});

// POST /api/teacher/quizzes/generate-from-slides - Generate quiz from slides
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const body = await req.json();

  const parsed = GenerateFromSlidesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const questions = await generateQuizFromSlides(parsed.data.slideAssetVersionId);

  const quizTitle = parsed.data.title || `Quiz from slides (${new Date().toLocaleDateString()})`;
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

  return NextResponse.json({
    quiz,
    questions,
    generatedCount: questions.length
  }, { status: 201 });
});
