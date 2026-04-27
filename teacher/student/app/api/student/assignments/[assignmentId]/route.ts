import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { canViewAssignment, getAssignmentClassName } from '@student/lib/server/access-control';
import { getAssignmentStatus, getSlideProgress } from '@student/lib/server/attempts';
import { getAssignmentById } from '@/lib/server/assignments';

// GET /api/student/assignments/[assignmentId] - Get a single assignment if authorized
export const GET = withRole(['student_classroom'], async (req: NextRequest, ctx: AuthContext) => {
  const studentId = ctx.user.id;

  // Extract assignmentId from URL path
  const pathParts = req.nextUrl.pathname.split('/').filter(Boolean);
  const assignmentId = pathParts[pathParts.length - 1];

  // Check if student can view this assignment
  if (!canViewAssignment(studentId, assignmentId)) {
    return NextResponse.json({ error: 'Assignment not found or not accessible' }, { status: 404 });
  }

  // Get the assignment details
  const assignment = getAssignmentById(assignmentId);
  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  // Get class name
  const className = getAssignmentClassName(assignmentId);

  // Get student's attempt status and progress
  const { status, attempt } = getAssignmentStatus(studentId, assignmentId);
  const slideProgress = getSlideProgress(studentId, assignmentId);

  return NextResponse.json({
    assignment: {
      ...assignment,
      class_name: className,
      student_status: status,
      attempt_id: attempt?.id || null,
      started_at: attempt?.started_at || null,
      submitted_at: attempt?.submitted_at || null,
      score_percent: attempt?.score_percent || null,
      viewed_slides: slideProgress.map((p) => p.slide_id)
    }
  });
});
