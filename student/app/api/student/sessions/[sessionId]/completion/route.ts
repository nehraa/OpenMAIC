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

  const sessionResult = await db.query(`
    SELECT id, status, class_id FROM classroom_sessions WHERE id = $1
  `, [sessionId]);

  const sessionData = sessionResult.rows[0] as { id: string; status: string; class_id: string } | undefined;

  if (!sessionData) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (sessionData.status === 'ended') {
    return NextResponse.json({ error: 'Cannot mark completion for ended session' }, { status: 400 });
  }

  const membershipResult = await db.query(`
    SELECT id FROM class_memberships WHERE class_id = $1 AND student_id = $2
  `, [sessionData.class_id, authResult.user.id]);

  const membership = membershipResult.rows[0];

  if (!membership) {
    return NextResponse.json({ error: 'You are not enrolled in this class' }, { status: 403 });
  }

  const existingParticipantResult = await db.query(`
    SELECT id, completion_state FROM session_participants
    WHERE session_id = $1 AND user_id = $2
  `, [sessionId, authResult.user.id]);

  const existingParticipant = existingParticipantResult.rows[0] as { id: string; completion_state: string } | undefined;

  if (existingParticipant) {
    await db.query(`
      UPDATE session_participants
      SET completion_state = 'completed', left_at = datetime('now')
      WHERE id = $1
    `, [existingParticipant.id]);
  } else {
    await db.query(`
      INSERT INTO session_participants (session_id, user_id, completion_state, left_at)
      VALUES ($1, $2, 'completed', datetime('now'))
    `, [sessionId, authResult.user.id]);
  }

  const participantResult = await db.query('SELECT * FROM session_participants WHERE session_id = $1 AND user_id = $2', [sessionId, authResult.user.id]);
  const participant = participantResult.rows[0];

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

  const participantResult = await db.query(`
    SELECT * FROM session_participants
    WHERE session_id = $1 AND user_id = $2
  `, [sessionId, authResult.user.id]);

  const participant = participantResult.rows[0] as { completion_state: string; left_at: string } | undefined;

  return NextResponse.json({
    completed: participant?.completion_state === 'completed',
    completed_at: participant?.left_at,
  });
};
