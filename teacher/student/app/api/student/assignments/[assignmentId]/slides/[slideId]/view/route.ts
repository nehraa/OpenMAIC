import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { canViewAssignment } from '@student/lib/server/access-control';
import { recordSlideView, getAssignmentStatus } from '@student/lib/server/attempts';
import { z } from 'zod';

const RecordSlideViewSchema = z.object({
  slideId: z.string().min(1)
});

// POST /api/student/assignments/[assignmentId]/slides/[slideId]/view - Record slide view
export const POST = withRole(['student_classroom'], async (req: NextRequest, ctx: AuthContext) => {
  const studentId = ctx.user.id;

  // Extract assignmentId and slideId from URL path
  const pathParts = req.nextUrl.pathname.split('/').filter(Boolean);
  const assignmentId = pathParts[pathParts.length - 3]; // [assignmentId]/slides/[slideId]/view
  const slideId = pathParts[pathParts.length - 2];

  // Check if student can view this assignment
  if (!canViewAssignment(studentId, assignmentId)) {
    return NextResponse.json({ error: 'Assignment not found or not accessible' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = RecordSlideViewSchema.safeParse(body);

  // Use slideId from path if not in body
  const finalSlideId = parsed.data?.slideId || slideId;

  try {
    // Ensure an attempt exists first
    const { attempt } = getAssignmentStatus(studentId, assignmentId);

    if (!attempt) {
      return NextResponse.json({ error: 'Must start assignment before recording slide views' }, { status: 400 });
    }

    const progress = recordSlideView(attempt.id, studentId, assignmentId, finalSlideId);

    return NextResponse.json({
      progress: {
        slide_id: progress.slide_id,
        viewed_at: progress.viewed_at
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to record slide view' }, { status: 500 });
  }
});
