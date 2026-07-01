import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { withTenant } from '@/lib/db';
import { submitQuizAttempt } from '@/lib/server/quiz-submit';

const SubmitBodySchema = z.object({
  answers: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.null()])
  ),
  startedAt: z.string().datetime().optional(),
});

// POST /api/student/quizzes/[assignmentId]/submit
// Grade the student's answers against the assignment's quiz payload and persist
// the attempt (UPSERT on the UNIQUE(assignment_id, student_id) constraint).
export const POST = async (
  request: NextRequest,
  context: { params: Promise<{ assignmentId: string }> }
) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = requireRole(authResult.user, ['student_classroom', 'student_b2c']);
  if (roleCheck) return roleCheck;

  const { assignmentId } = await context.params;
  if (!assignmentId) {
    return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = SubmitBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const result = await withTenant(authResult.tenantId, async (client) =>
    submitQuizAttempt(client, {
      assignmentId,
      studentId: authResult.user.id,
      answers: parsed.data.answers,
      startedAt: parsed.data.startedAt,
    })
  );

  if (result.kind === 'assignment_not_found') {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }
  if (result.kind === 'no_quiz') {
    return NextResponse.json({ error: 'No quiz for this assignment' }, { status: 404 });
  }
  if (result.kind === 'db_error') {
    return NextResponse.json(
      { error: 'Failed to persist attempt', detail: result.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    attemptId: result.attemptId,
    scorePercent: result.graded.scorePercent,
    pointsEarned: result.graded.pointsEarned,
    totalPoints: result.graded.totalPoints,
    results: result.graded.results,
  });
};