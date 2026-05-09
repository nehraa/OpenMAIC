import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { getDb } from '@/lib/db';

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

  const db = getDb();

  const sessionResult = await db.query(`
    SELECT cs.*,
           c.name as class_name,
           c.join_code as class_join_code,
           u.name as teacher_name
    FROM classroom_sessions cs
    JOIN classes c ON cs.class_id = c.id
    JOIN users u ON cs.teacher_id = u.id
    WHERE cs.id = $1
  `, [sessionId]);

  const session = sessionResult.rows[0] as any;

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Verify student is enrolled in the class
  const membershipResult = await db.query(`
    SELECT * FROM class_memberships
    WHERE class_id = $1 AND student_id = $2
  `, [session.class_id, authResult.user.id]);

  const membership = membershipResult.rows[0];

  if (!membership) {
    return NextResponse.json({ error: 'You are not enrolled in this class' }, { status: 403 });
  }

  const participationResult = await db.query(`
    SELECT * FROM session_participants
    WHERE session_id = $1 AND user_id = $2
  `, [sessionId, authResult.user.id]);

  const participation = participationResult.rows[0] || null;

  return NextResponse.json({ session, participation });
};
