import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { canViewAssignment } from '@student/lib/server/access-control';
import { submitAttempt, getAttemptWithResults } from '@student/lib/server/attempts';
import { z } from 'zod';

const SubmitAttemptSchema = z.object({
  attemptId: z.string().min(1),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())]))
});

// POST /api/student/assignments/[assignmentId]/submit - Submit an attempt
export const POST = withRole(['student_classroom'], async (req: NextRequest, ctx: AuthContext) => {
  const studentId = ctx.user.id;

  // Extract assignmentId from URL path
  const pathParts = req.nextUrl.pathname.split('/').filter(Boolean);
  const assignmentId = pathParts[pathParts.length - 2]; // [assignmentId]/submit

  // Check if student can view this assignment
  if (!canViewAssignment(studentId, assignmentId)) {
    return NextResponse.json({ error: 'Assignment not found or not accessible' }, { status: 404 });
  }

  const body = await req.json();
  const parsed = SubmitAttemptSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  try {
    const attempt = submitAttempt(
      parsed.data.attemptId,
      studentId,
      assignmentId,
      parsed.data.answers
    );

    // Get full attempt with results
    const attemptWithResults = getAttemptWithResults(attempt.id);

    return NextResponse.json({
      attempt: attemptWithResults,
      message: 'Assignment submitted successfully'
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to submit attempt' }, { status: 500 });
  }
});
