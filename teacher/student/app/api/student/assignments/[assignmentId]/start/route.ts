import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { canViewAssignment } from '@student/lib/server/access-control';
import { startAttempt } from '@student/lib/server/attempts';

// POST /api/student/assignments/[assignmentId]/start - Start an attempt on an assignment
export const POST = withRole(['student_classroom'], async (req: NextRequest, ctx: AuthContext) => {
  const studentId = ctx.user.id;

  // Extract assignmentId from URL path
  const pathParts = req.nextUrl.pathname.split('/').filter(Boolean);
  const assignmentId = pathParts[pathParts.length - 2]; // [assignmentId]/start

  // Check if student can view this assignment
  if (!canViewAssignment(studentId, assignmentId)) {
    return NextResponse.json({ error: 'Assignment not found or not accessible' }, { status: 404 });
  }

  try {
    const attempt = startAttempt(studentId, assignmentId);

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        assignment_id: attempt.assignment_id,
        student_id: attempt.student_id,
        started_at: attempt.started_at,
        completion_state: attempt.completion_state
      }
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to start attempt' }, { status: 500 });
  }
});
