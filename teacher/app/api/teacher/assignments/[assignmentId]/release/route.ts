import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { getAssignmentById, releaseAssignment } from '@/lib/server/assignments';

// POST /api/teacher/assignments/[assignmentId]/release - Release an assignment
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  // Extract assignmentId from URL path
  const pathParts = req.nextUrl.pathname.split('/').filter(Boolean);
  const assignmentId = pathParts[pathParts.length - 2]; // /api/teacher/assignments/{assignmentId}/release

  const assignment = getAssignmentById(assignmentId);
  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  if (assignment.teacher_id !== ctx.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    const released = releaseAssignment(assignmentId);
    if (!released) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }
    return NextResponse.json({ assignment: released });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to release assignment' }, { status: 500 });
  }
});
