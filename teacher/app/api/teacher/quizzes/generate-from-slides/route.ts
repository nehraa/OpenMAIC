import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { generateQuizFromSlides, createQuiz } from '@/lib/server/quizzes';
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

  // Generate questions from slides
  const questions = generateQuizFromSlides(parsed.data.slideAssetVersionId);

  // Create a quiz with the generated questions
  const quizTitle = parsed.data.title || `Quiz from slides (${new Date().toLocaleDateString()})`;
  const quiz = createQuiz({
    title: quizTitle,
    teacherId: ctx.user.id,
    subjectTag: 'auto-generated'
  });

  // Add generated questions to the quiz
  const { addQuestion } = await import('@/lib/server/quizzes');
  for (const question of questions) {
    addQuestion(quiz.id, {
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