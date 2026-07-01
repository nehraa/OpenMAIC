import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { withTenant } from '@/lib/db';

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
  const studentId = authResult.user.id;

  const result = await withTenant(authResult.tenantId, async (client) => {
    const sessionResult = await client.query<{ id: string; status: string; assignment_id: string }>(
      `SELECT id, status, assignment_id FROM live_sessions WHERE id = $1`,
      [sessionId]
    );
    const session = sessionResult.rows[0];
    if (!session) return { kind: 'not_found' as const };

    const enrollmentResult = await client.query(
      `SELECT ar.id FROM assignment_recipients ar
       JOIN assignments a ON ar.assignment_id = a.id
       JOIN class_memberships cm ON cm.class_id = a.class_id
       WHERE ar.assignment_id = $1 AND ar.student_id = $2 AND cm.student_id = $3`,
      [session.assignment_id, studentId, studentId]
    );
    if (enrollmentResult.rows.length === 0) return { kind: 'not_enrolled' as const };

    const existingParticipantResult = await client.query<{ id: string; completion_state: string }>(
      `SELECT id, completion_state FROM live_session_participants
       WHERE live_session_id = $1 AND user_id = $2`,
      [sessionId, studentId]
    );
    const existingParticipant = existingParticipantResult.rows[0];

    if (existingParticipant) {
      await client.query(
        `UPDATE live_session_participants
         SET joined_at = NOW(), left_at = NULL, completion_state = 'in_progress'
         WHERE id = $1`,
        [existingParticipant.id]
      );
    } else {
      await client.query(
        `INSERT INTO live_session_participants (live_session_id, user_id, joined_at)
         VALUES ($1, $2, NOW())`,
        [sessionId, studentId]
      );
    }

    const participantResult = await client.query(
      `SELECT * FROM live_session_participants WHERE live_session_id = $1 AND user_id = $2`,
      [sessionId, studentId]
    );
    return { kind: 'ok' as const, participant: participantResult.rows[0] };
  });

  if (result.kind === 'not_found') {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  if (result.kind === 'not_enrolled') {
    return NextResponse.json({ error: 'Not enrolled in this class' }, { status: 403 });
  }
  return NextResponse.json({ participant: result.participant }, { status: 200 });
};