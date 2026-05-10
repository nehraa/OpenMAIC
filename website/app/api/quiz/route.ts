import { NextRequest, NextResponse } from 'next/server';
import { quizQuestions } from '@/app/lib/mock-data';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const quizId = searchParams.get('quizId');

  if (quizId) {
    const quiz = quizQuestions.find((q) => q.quizId === quizId);
    if (!quiz) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Quiz not found' } },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: quiz,
    });
  }

  // Return all quizzes if no specific quizId provided
  return NextResponse.json({
    success: true,
    data: quizQuestions,
  });
}
