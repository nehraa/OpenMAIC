import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { createQuiz, getQuizzesForTeacher } from '@/lib/server/quizzes';
import { getDb } from '@/lib/db';
import { z } from 'zod';

const CreateQuizSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subjectTag: z.string().optional()
});

// GET /api/teacher/quizzes - List quizzes for teacher
export const GET = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const db = getDb();
  const url = new URL(req.url);
  const status = url.searchParams.get('status') as 'draft' | 'published' | undefined;

  const quizzes = getQuizzesForTeacher(ctx.user.id, { status });

  return NextResponse.json({ quizzes });
});

// POST /api/teacher/quizzes - Create a new quiz
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const body = await req.json();

  const parsed = CreateQuizSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const quiz = createQuiz({
    title: parsed.data.title,
    teacherId: ctx.user.id,
    subjectTag: parsed.data.subjectTag
  });

  return NextResponse.json({ quiz }, { status: 201 });
});