import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { getDb } from '@/lib/db';
import { joinSession, getSessionById } from '@/lib/server/live-sessions';

// POST /api/student/live-sessions/[sessionId]/join - Join a live session
export const POST = async (
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = requireRole(authResult.user, ['student_classroom', 'student_b2c']);
  if (roleCheck) return roleCheck;

  const { sessionId } = await context.params;

  const db = getDb();

  // Get the session
  const session = getSessionById(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Verify student is enrolled in the assignment's class
  const enrollment = db.prepare(`
    SELECT ar.id FROM assignment_recipients ar
    JOIN assignments a ON ar.assignment_id = a.id
    JOIN class_memberships cm ON cm.class_id = a.class_id
    WHERE ar.assignment_id = ? AND cm.student_id = ?
  `).get(session.assignment_id, authResult.user.id);

  if (!enrollment) {
    return NextResponse.json({ error: 'Not enrolled in this class' }, { status: 403 });
  }

  try {
    const participant = joinSession(sessionId, authResult.user.id);
    return NextResponse.json({ participant }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to join session';
    return NextResponse.json({ error: message }, { status: 400 });
  }
};
