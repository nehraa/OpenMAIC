import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { getQuizById, getQuizWithVersion, updateQuiz } from '@/lib/server/quizzes';
import { getDb } from '@/lib/db';
import { z } from 'zod';

const UpdateQuizSchema = z.object({
  title: z.string().min(1).optional(),
  subjectTag: z.string().optional()
});

// GET /api/teacher/quizzes/[quizId] - Get single quiz
export const GET = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { quizId } = await routeCtx.params;

  const quiz = await getQuizById(quizId);

  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  }

  if (quiz.owner_teacher_id !== ctx.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const quizWithVersion = await getQuizWithVersion(quizId);

  if (!quizWithVersion) {
    return NextResponse.json({ error: 'Quiz version not found' }, { status: 404 });
  }

  return NextResponse.json({
    quiz: quizWithVersion.quiz,
    version: quizWithVersion.version,
    payload: quizWithVersion.payload
  });
});

// PATCH /api/teacher/quizzes/[quizId] - Update quiz
export const PATCH = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { quizId } = await routeCtx.params;

  const quiz = await getQuizById(quizId);
  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  }

  if (quiz.owner_teacher_id !== ctx.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = UpdateQuizSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  try {
    const updated = await updateQuiz(quizId, {
      title: parsed.data.title,
      subjectTag: parsed.data.subjectTag
    });
    if (!updated) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    return NextResponse.json({ quiz: updated });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update quiz' }, { status: 500 });
  }
});

// DELETE /api/teacher/quizzes/[quizId] - Delete quiz (only draft)
export const DELETE = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { quizId } = await routeCtx.params;

  const quiz = await getQuizById(quizId);
  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  }

  if (quiz.owner_teacher_id !== ctx.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const quizWithVersion = await getQuizWithVersion(quizId);

  if (!quizWithVersion) {
    return NextResponse.json({ error: 'Quiz version not found' }, { status: 404 });
  }

  if (quizWithVersion.version.status !== 'draft') {
    return NextResponse.json({ error: 'Can only delete draft quizzes' }, { status: 400 });
  }

  const db = getDb();
  await db.query('DELETE FROM content_assets WHERE id = $1', [quizId]);

  return new NextResponse(null, { status: 204 });
});
