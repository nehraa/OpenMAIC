import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/middleware/auth';
import { createLiveSession, getActiveSessionsForAssignment } from '@/lib/server/live-sessions';
import { z } from 'zod';

const CreateLiveSessionSchema = z.object({
  assignmentId: z.string().min(1)
});

// POST /api/teacher/live-sessions - Create a new live session from assignment
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const body = await req.json();

  const parsed = CreateLiveSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { assignmentId } = parsed.data;
  const db = getDb();

  // Verify assignment belongs to teacher
  const assignment = db.prepare('SELECT id FROM assignments WHERE id = ? AND teacher_id = ?').get(assignmentId, ctx.user.id);
  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  // Check for existing live session for this assignment
  const activeSessions = getActiveSessionsForAssignment(assignmentId);
  if (activeSessions.length > 0) {
    return NextResponse.json({ error: 'An active live session already exists for this assignment' }, { status: 409 });
  }

  const session = createLiveSession(assignmentId, ctx.user.id);

  return NextResponse.json({ session }, { status: 201 });
});
