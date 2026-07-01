import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { withTenant } from '@/lib/db';

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

  const studentId = authResult.user.id;

  const result = await withTenant(authResult.tenantId, async (client) => {
    const sessionResult = await client.query<{ id: string; status: string; class_id: string }>(
      `SELECT id, status, class_id FROM classroom_sessions WHERE id = $1`,
      [sessionId]
    );
    const sessionData = sessionResult.rows[0];
    if (!sessionData) {
      return { kind: 'not_found' as const };
    }
    if (sessionData.status === 'ended') {
      return { kind: 'ended' as const };
    }

    const membershipResult = await client.query(
      `SELECT id FROM class_memberships WHERE class_id = $1 AND student_id = $2`,
      [sessionData.class_id, studentId]
    );
    if (membershipResult.rows.length === 0) {
      return { kind: 'not_enrolled' as const };
    }

    const existingParticipantResult = await client.query<{ id: string; completion_state: string }>(
      `SELECT id, completion_state FROM session_participants
       WHERE session_id = $1 AND user_id = $2`,
      [sessionId, studentId]
    );
    const existingParticipant = existingParticipantResult.rows[0];

    if (existingParticipant) {
      await client.query(
        `UPDATE session_participants
         SET completion_state = 'completed', left_at = NOW()
         WHERE id = $1`,
        [existingParticipant.id]
      );
    } else {
      await client.query(
        `INSERT INTO session_participants (session_id, user_id, completion_state, left_at)
         VALUES ($1, $2, 'completed', NOW())`,
        [sessionId, studentId]
      );
    }

    const participantResult = await client.query(
      `SELECT * FROM session_participants WHERE session_id = $1 AND user_id = $2`,
      [sessionId, studentId]
    );
    return { kind: 'ok' as const, participant: participantResult.rows[0] };
  });

  if (result.kind === 'not_found') {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  if (result.kind === 'ended') {
    return NextResponse.json({ error: 'Cannot mark completion for ended session' }, { status: 400 });
  }
  if (result.kind === 'not_enrolled') {
    return NextResponse.json({ error: 'You are not enrolled in this class' }, { status: 403 });
  }
  return NextResponse.json({ success: true, participant: result.participant });
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

  const result = await withTenant(authResult.tenantId, async (client) => {
    const participantResult = await client.query<{ completion_state: string; left_at: string }>(
      `SELECT completion_state, left_at FROM session_participants
       WHERE session_id = $1 AND user_id = $2`,
      [sessionId, authResult.user.id]
    );
    return participantResult.rows[0];
  });

  return NextResponse.json({
    completed: result?.completion_state === 'completed',
    completed_at: result?.left_at ?? null,
  });
};
