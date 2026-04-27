import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/middleware/auth';
import { createAssignment, getAssignmentsForTeacher } from '@/lib/server/assignments';
import { z } from 'zod';

const CreateAssignmentSchema = z.object({
  classId: z.string().min(1),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  slideAssetVersionId: z.string().optional(),
  quizAssetVersionId: z.string().optional(),
  releaseAt: z.string().optional(),
  dueAt: z.string().optional()
});

// GET /api/teacher/assignments - List assignments for teacher
export const GET = withRole(['teacher'], async (_req: NextRequest, ctx: AuthContext) => {
  const db = getDb();

  // Get filter params from URL
  const url = new URL(_req.url);
  const classId = url.searchParams.get('classId') || undefined;
  const status = url.searchParams.get('status') as 'draft' | 'scheduled' | 'released' | 'closed' | undefined;

  const assignments = getAssignmentsForTeacher(ctx.user.id, { classId, status });

  return NextResponse.json({ assignments });
});

// POST /api/teacher/assignments - Create a new assignment
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const body = await req.json();

  const parsed = CreateAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;

  // Verify class belongs to teacher
  const db = getDb();
  const classRecord = db.prepare('SELECT id FROM classes WHERE id = ? AND teacher_id = ?').get(data.classId, ctx.user.id);
  if (!classRecord) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  const assignment = createAssignment({
    classId: data.classId,
    teacherId: ctx.user.id,
    title: data.title,
    description: data.description,
    slideAssetVersionId: data.slideAssetVersionId,
    quizAssetVersionId: data.quizAssetVersionId,
    releaseAt: data.releaseAt,
    dueAt: data.dueAt
  });

  return NextResponse.json({ assignment }, { status: 201 });
});
