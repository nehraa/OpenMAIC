import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { getQuizById, publishQuiz } from '@/lib/server/quizzes';

// Helper to extract quizId from path
function extractQuizId(req: NextRequest): string {
  const pathParts = req.nextUrl.pathname.split('/').filter(Boolean);
  // /api/teacher/quizzes/{quizId}/publish
  return pathParts[pathParts.length - 2] || ''; // Get second to last
}

// POST /api/teacher/quizzes/[quizId]/publish - Publish quiz
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const quizId = extractQuizId(req);

  const quiz = getQuizById(quizId);
  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  }

  if (quiz.owner_teacher_id !== ctx.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    const updated = publishQuiz(quizId);
    if (!updated) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    return NextResponse.json({ quiz: updated });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to publish quiz' }, { status: 500 });
  }
});