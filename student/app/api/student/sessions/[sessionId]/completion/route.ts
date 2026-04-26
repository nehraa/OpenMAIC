import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { getDb } from '@/lib/db';

// POST /api/student/sessions/[sessionId]/completion
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

  const sessionData = db.prepare(`
    SELECT id, status, class_id FROM classroom_sessions WHERE id = ?
  `).get(sessionId) as { id: string; status: string; class_id: string } | undefined;

  if (!sessionData) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (sessionData.status === 'ended') {
    return NextResponse.json({ error: 'Cannot mark completion for ended session' }, { status: 400 });
  }

  const membership = db.prepare(`
    SELECT id FROM class_memberships WHERE class_id = ? AND student_id = ?
  `).get(sessionData.class_id, authResult.user.id);

  if (!membership) {
    return NextResponse.json({ error: 'You are not enrolled in this class' }, { status: 403 });
  }

  const existingParticipant = db.prepare(`
    SELECT id, completion_state FROM session_participants
    WHERE session_id = ? AND user_id = ?
  `).get(sessionId, authResult.user.id) as { id: string; completion_state: string } | undefined;

  if (existingParticipant) {
    db.prepare(`
      UPDATE session_participants
      SET completion_state = 'completed', left_at = datetime('now')
      WHERE id = ?
    `).run(existingParticipant.id);
  } else {
    db.prepare(`
      INSERT INTO session_participants (session_id, user_id, completion_state, left_at)
      VALUES (?, ?, 'completed', datetime('now'))
    `).run(sessionId, authResult.user.id);
  }

  const participant = db.prepare('SELECT * FROM session_participants WHERE session_id = ? AND user_id = ?').get(sessionId, authResult.user.id);

  return NextResponse.json({ success: true, participant });
};

// GET /api/student/sessions/[sessionId]/completion
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
    SELECT * FROM session_participants
    WHERE session_id = ? AND user_id = ?
  `).get(sessionId, authResult.user.id) as { completion_state: string; left_at: string } | undefined;

  return NextResponse.json({
    completed: participant?.completion_state === 'completed',
    completed_at: participant?.left_at,
  });
};
