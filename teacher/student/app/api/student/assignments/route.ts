import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { getVisibleAssignments, getAssignmentClassName } from '@student/lib/server/access-control';
import { getAssignmentStatus } from '@student/lib/server/attempts';

// GET /api/student/assignments - List visible assignments for the student
export const GET = withRole(['student_classroom'], async (_req: NextRequest, ctx: AuthContext) => {
  const studentId = ctx.user.id;

  const assignments = getVisibleAssignments(studentId);

  // Enrich with class names and attempt status
  const enrichedAssignments = assignments.map((assignment) => {
    const className = getAssignmentClassName(assignment.id);
    const { status, attempt } = getAssignmentStatus(studentId, assignment.id);

    return {
      ...assignment,
      class_name: className,
      student_status: status,
      attempt_id: attempt?.id || null,
      started_at: attempt?.started_at || null,
      submitted_at: attempt?.submitted_at || null,
      score_percent: attempt?.score_percent || null
    };
  });

  return NextResponse.json({ assignments: enrichedAssignments });
});
