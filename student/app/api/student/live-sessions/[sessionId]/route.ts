import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { withTenant } from '@/lib/db';

interface LiveSessionRow {
  id: string;
  assignment_id: string;
  state_snapshot_json: string | null;
  teacher_id: string;
  status: string;
  assignment_title: string;
  teacher_name: string;
  [key: string]: unknown;
}

interface ParticipationRow {
  id: string;
  live_session_id: string;
  user_id: string;
  completion_state: string;
  joined_at: string;
  left_at: string | null;
  [key: string]: unknown;
}

// GET /api/student/live-sessions/[sessionId]
export const GET = async (
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = requireRole(authResult.user, ['student_classroom', 'student_b2c']);
  if (roleCheck) return roleCheck;

  const { sessionId } = await context.params;

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  const studentId = authResult.user.id;

  const result = await withTenant(authResult.tenantId, async (client) => {
    const sessionResult = await client.query<LiveSessionRow>(
      `SELECT ls.*,
              a.title as assignment_title,
              u.name as teacher_name
       FROM live_sessions ls
       JOIN assignments a ON ls.assignment_id = a.id
       JOIN users u ON ls.teacher_id = u.id
       WHERE ls.id = $1`,
      [sessionId]
    );
    const session = sessionResult.rows[0];
    if (!session) return { kind: 'not_found' as const };

    const enrollmentResult = await client.query(
      `SELECT ar.id FROM assignment_recipients ar
       JOIN assignments a ON ar.assignment_id = a.id
       JOIN class_memberships cm ON cm.class_id = a.class_id
       WHERE ar.assignment_id = $1
         AND cm.student_id = $2
         AND ar.student_id = $3`,
      [session.assignment_id, studentId, studentId]
    );
    if (enrollmentResult.rows.length === 0) return { kind: 'not_enrolled' as const };

    const participationResult = await client.query<ParticipationRow>(
      `SELECT * FROM live_session_participants
       WHERE live_session_id = $1 AND user_id = $2`,
      [sessionId, studentId]
    );

    return {
      kind: 'ok' as const,
      session,
      participation: participationResult.rows[0] ?? null,
    };
  });

  if (result.kind === 'not_found') {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  if (result.kind === 'not_enrolled') {
    return NextResponse.json({ error: 'You are not enrolled in this class' }, { status: 403 });
  }

  const state = result.session.state_snapshot_json
    ? JSON.parse(result.session.state_snapshot_json)
    : null;

  return NextResponse.json({
    session: { ...result.session, state },
    participation: result.participation,
  });
};