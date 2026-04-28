import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { getAssignmentById, addRecipients } from '@/lib/server/assignments';
import { z } from 'zod';

const AddRecipientsSchema = z.object({
  studentIds: z.array(z.string().min(1)).min(1, 'At least one student ID is required')
});

// POST /api/teacher/assignments/[assignmentId]/recipients - Add recipients to assignment
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { assignmentId } = await routeCtx.params;

  const assignment = await getAssignmentById(assignmentId);
  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  if (assignment.teacher_id !== ctx.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  if (assignment.status !== 'draft') {
    return NextResponse.json({ error: 'Can only add recipients to draft assignments' }, { status: 400 });
  }

  const body = await req.json();
  const parsed = AddRecipientsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const recipients = await addRecipients(assignmentId, parsed.data.studentIds);

  return NextResponse.json({ recipients }, { status: 201 });
});
