import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { getQuizById, addQuestion } from '@/lib/server/quizzes';
import { z } from 'zod';

const AddQuestionSchema = z.object({
  type: z.enum(['mcq', 'short_answer']),
  question: z.string().min(1, 'Question text is required'),
  options: z.array(z.string()).optional(),
  correctIndex: z.number().int().min(0).optional(),
  sampleAnswer: z.string().optional(),
  points: z.number().int().positive().default(1)
});

// Helper to extract quizId from path
function extractQuizId(req: NextRequest): string {
  const pathParts = req.nextUrl.pathname.split('/').filter(Boolean);
  // /api/teacher/quizzes/{quizId}/questions
  return pathParts[pathParts.length - 2] || '';
}

// POST /api/teacher/quizzes/[quizId]/questions - Add question to quiz
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const quizId = extractQuizId(req);

  const quiz = getQuizById(quizId);
  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  }

  if (quiz.owner_teacher_id !== ctx.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = AddQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  // Validate MCQ-specific fields
  if (parsed.data.type === 'mcq') {
    if (!parsed.data.options || parsed.data.options.length < 2) {
      return NextResponse.json({ error: 'MCQ must have at least 2 options' }, { status: 400 });
    }
    if (parsed.data.correctIndex === undefined) {
      return NextResponse.json({ error: 'MCQ requires correctIndex' }, { status: 400 });
    }
  }

  try {
    const question = addQuestion(quizId, {
      type: parsed.data.type,
      question: parsed.data.question,
      options: parsed.data.options,
      correctIndex: parsed.data.correctIndex,
      sampleAnswer: parsed.data.sampleAnswer,
      points: parsed.data.points
    });
    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to add question' }, { status: 500 });
  }
});