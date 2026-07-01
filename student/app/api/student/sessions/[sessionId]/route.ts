import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { withTenant } from '@/lib/db';

interface ClassroomSessionRow {
  id: string;
  class_id: string;
  teacher_id: string;
  status: string;
  class_name: string;
  class_join_code: string;
  teacher_name: string;
}

interface ParticipationRow {
  id: string;
  session_id: string;
  user_id: string;
  completion_state: string;
  joined_at: string;
  left_at: string | null;
  [key: string]: unknown;
}

// GET /api/student/sessions/[sessionId]
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
    const sessionResult = await client.query<ClassroomSessionRow>(
      `SELECT cs.id, cs.class_id, cs.teacher_id, cs.status,
              c.name as class_name,
              c.join_code as class_join_code,
              u.name as teacher_name
       FROM classroom_sessions cs
       JOIN classes c ON cs.class_id = c.id
       JOIN users u ON cs.teacher_id = u.id
       WHERE cs.id = $1`,
      [sessionId]
    );
    const session = sessionResult.rows[0];
    if (!session) {
      return { notFound: true as const };
    }

    const membershipResult = await client.query(
      `SELECT * FROM class_memberships WHERE class_id = $1 AND student_id = $2`,
      [session.class_id, studentId]
    );
    if (membershipResult.rows.length === 0) {
      return { notEnrolled: true as const };
    }

    const participationResult = await client.query<ParticipationRow>(
      `SELECT * FROM session_participants WHERE session_id = $1 AND user_id = $2`,
      [sessionId, studentId]
    );

    return { session, participation: participationResult.rows[0] ?? null };
  });

  if ('notFound' in result && result.notFound) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  if ('notEnrolled' in result && result.notEnrolled) {
    return NextResponse.json({ error: 'You are not enrolled in this class' }, { status: 403 });
  }

  return NextResponse.json(result);
};
