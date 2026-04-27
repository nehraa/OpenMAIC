import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { getAssignmentById, updateAssignment, deleteAssignment } from '@/lib/server/assignments';
import { z } from 'zod';

const UpdateAssignmentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  slideAssetVersionId: z.string().nullable().optional(),
  quizAssetVersionId: z.string().nullable().optional(),
  releaseAt: z.string().nullable().optional(),
  dueAt: z.string().nullable().optional(),
  status: z.enum(['draft', 'scheduled', 'released', 'closed']).optional()
});

// GET /api/teacher/assignments/[assignmentId] - Get single assignment
export const GET = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  // Extract assignmentId from URL path
  const pathParts = req.nextUrl.pathname.split('/').filter(Boolean);
  const assignmentId = pathParts[pathParts.length - 1]; // /api/teacher/assignments/{assignmentId}

  const assignment = getAssignmentById(assignmentId);

  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  // Verify teacher owns this assignment
  if (assignment.teacher_id !== ctx.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  return NextResponse.json({ assignment });
});

// PATCH /api/teacher/assignments/[assignmentId] - Update assignment
export const PATCH = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  // Extract assignmentId from URL path
  const pathParts = req.nextUrl.pathname.split('/').filter(Boolean);
  const assignmentId = pathParts[pathParts.length - 1]; // /api/teacher/assignments/{assignmentId}

  const assignment = getAssignmentById(assignmentId);
  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  if (assignment.teacher_id !== ctx.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = UpdateAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  // Convert null to undefined for fields that can be null in DB but undefined in update
  const updateData = {
    title: parsed.data.title,
    description: parsed.data.description,
    slideAssetVersionId: parsed.data.slideAssetVersionId ?? undefined,
    quizAssetVersionId: parsed.data.quizAssetVersionId ?? undefined,
    releaseAt: parsed.data.releaseAt ?? undefined,
    dueAt: parsed.data.dueAt ?? undefined,
    status: parsed.data.status
  };

  try {
    const updated = updateAssignment(assignmentId, updateData);
    if (!updated) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }
    return NextResponse.json({ assignment: updated });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
  }
});

// DELETE /api/teacher/assignments/[assignmentId] - Delete assignment
export const DELETE = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  // Extract assignmentId from URL path
  const pathParts = req.nextUrl.pathname.split('/').filter(Boolean);
  const assignmentId = pathParts[pathParts.length - 1]; // /api/teacher/assignments/{assignmentId}

  const assignment = getAssignmentById(assignmentId);
  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  if (assignment.teacher_id !== ctx.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    deleteAssignment(assignmentId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
  }
});