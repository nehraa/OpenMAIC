import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { getDb } from '@/lib/db';

// POST /api/student/live-sessions/[sessionId]/completion
export const POST = async (
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = requireRole(authResult.user, ['student_classroom', 'student_b2c']);
  if (roleCheck) return roleCheck;

  const { sessionId } = await context.params;
  const { completion_state } = await request.json();

  if (completion_state !== 'completed') {
    return NextResponse.json({ error: 'Invalid completion state' }, { status: 400 });
  }

  const db = getDb();

  const session = db.prepare(`
    SELECT id, status, assignment_id FROM live_sessions WHERE id = ?
  `).get(sessionId) as { id: string; status: string; assignment_id: string } | undefined;

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (session.status === 'ended') {
    return NextResponse.json({ error: 'Cannot mark completion for ended session' }, { status: 400 });
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

  const existingParticipant = db.prepare(`
    SELECT id, completion_state FROM live_session_participants
    WHERE live_session_id = ? AND user_id = ?
  `).get(sessionId, authResult.user.id) as { id: string; completion_state: string } | undefined;

  if (existingParticipant) {
    db.prepare(`
      UPDATE live_session_participants
      SET completion_state = 'completed', left_at = datetime('now')
      WHERE id = ?
    `).run(existingParticipant.id);
  } else {
    db.prepare(`
      INSERT INTO live_session_participants (live_session_id, user_id, completion_state, left_at)
      VALUES (?, ?, 'completed', datetime('now'))
    `).run(sessionId, authResult.user.id);
  }

  const participant = db.prepare('SELECT * FROM live_session_participants WHERE live_session_id = ? AND user_id = ?').get(sessionId, authResult.user.id);

  return NextResponse.json({ success: true, participant });
};

// GET /api/student/live-sessions/[sessionId]/completion
export const GET = async (
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = requireRole(authResult.user, ['student_classroom', 'student_b2c']);
  if (roleCheck) return roleCheck;

  const { sessionId } = await context.params;

  const db = getDb();

  const participant = db.prepare(`
    SELECT completion_state, left_at FROM live_session_participants
    WHERE live_session_id = ? AND user_id = ?
  `).get(sessionId, authResult.user.id) as { completion_state: string; left_at: string } | undefined;

  return NextResponse.json({
    completed: participant?.completion_state === 'completed',
    completed_at: participant?.left_at,
  });
};
