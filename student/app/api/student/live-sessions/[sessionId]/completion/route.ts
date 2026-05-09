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

  const sessionResult = await db.query(`
    SELECT id, status, assignment_id FROM live_sessions WHERE id = $1
  `, [sessionId]);

  const session = sessionResult.rows[0] as { id: string; status: string; assignment_id: string } | undefined;

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (session.status === 'ended') {
    return NextResponse.json({ error: 'Cannot mark completion for ended session' }, { status: 400 });
  }

  // Verify student is enrolled in the assignment's class and is a recipient of the assignment
  const enrollmentResult = await db.query(`
    SELECT ar.id FROM assignment_recipients ar
    JOIN assignments a ON ar.assignment_id = a.id
    JOIN class_memberships cm ON cm.class_id = a.class_id
    WHERE ar.assignment_id = $1 AND cm.student_id = $2 AND ar.student_id = $3
  `, [session.assignment_id, authResult.user.id, authResult.user.id]);

  const enrollment = enrollmentResult.rows[0];

  if (!enrollment) {
    return NextResponse.json({ error: 'Not assigned to this session' }, { status: 403 });
  }

  const existingParticipantResult = await db.query(`
    SELECT id, completion_state FROM live_session_participants
    WHERE live_session_id = $1 AND user_id = $2
  `, [sessionId, authResult.user.id]);

  const existingParticipant = existingParticipantResult.rows[0] as { id: string; completion_state: string } | undefined;

  if (existingParticipant) {
    await db.query(`
      UPDATE live_session_participants
      SET completion_state = 'completed', left_at = datetime('now')
      WHERE id = $1
    `, [existingParticipant.id]);
  } else {
    await db.query(`
      INSERT INTO live_session_participants (live_session_id, user_id, completion_state, left_at)
      VALUES ($1, $2, 'completed', datetime('now'))
    `, [sessionId, authResult.user.id]);
  }

  const participantResult = await db.query('SELECT * FROM live_session_participants WHERE live_session_id = $1 AND user_id = $2', [sessionId, authResult.user.id]);
  const participant = participantResult.rows[0];

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

  const participantResult = await db.query(`
    SELECT completion_state, left_at FROM live_session_participants
    WHERE live_session_id = $1 AND user_id = $2
  `, [sessionId, authResult.user.id]);

  const participant = participantResult.rows[0] as { completion_state: string; left_at: string } | undefined;

  return NextResponse.json({
    completed: participant?.completion_state === 'completed',
    completed_at: participant?.left_at,
  });
};
