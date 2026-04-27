import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { updateQuestion, deleteQuestion } from '@/lib/server/quizzes';
import { z } from 'zod';

const UpdateQuestionSchema = z.object({
  question: z.string().min(1).optional(),
  options: z.array(z.string()).optional(),
  correctIndex: z.number().int().min(0).optional(),
  sampleAnswer: z.string().optional(),
  points: z.number().int().positive().optional()
});

// Helper to extract IDs from path
function extractQuizAndQuestionId(req: NextRequest): { quizId: string; questionId: string } {
  const pathParts = req.nextUrl.pathname.split('/').filter(Boolean);
  // /api/teacher/quizzes/{quizId}/questions/{questionId}
  const questionId = pathParts[pathParts.length - 1] || '';
  const quizId = pathParts[pathParts.length - 3] || '';
  return { quizId, questionId };
}

// PATCH /api/teacher/quizzes/[quizId]/questions/[questionId] - Update question
export const PATCH = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const { quizId, questionId } = extractQuizAndQuestionId(req);

  // Verify quiz ownership
  const { getQuizById } = await import('@/lib/server/quizzes');
  const quiz = getQuizById(quizId);
  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  }
  if (quiz.owner_teacher_id !== ctx.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = UpdateQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  try {
    const updated = updateQuestion(quizId, questionId, {
      question: parsed.data.question,
      options: parsed.data.options,
      correctIndex: parsed.data.correctIndex,
      sampleAnswer: parsed.data.sampleAnswer,
      points: parsed.data.points
    });
    if (!updated) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    return NextResponse.json({ question: updated });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
});

// DELETE /api/teacher/quizzes/[quizId]/questions/[questionId] - Delete question
export const DELETE = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const { quizId, questionId } = extractQuizAndQuestionId(req);

  // Verify quiz ownership
  const { getQuizById } = await import('@/lib/server/quizzes');
  const quiz = getQuizById(quizId);
  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  }
  if (quiz.owner_teacher_id !== ctx.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const deleted = deleteQuestion(quizId, questionId);
  if (!deleted) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
});