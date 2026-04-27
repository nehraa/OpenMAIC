import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { getDb } from '@/lib/db';

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

  const db = getDb();

  // Get the live session with assignment info
  const session = db.prepare(`
    SELECT ls.*,
           a.title as assignment_title,
           u.name as teacher_name
    FROM live_sessions ls
    JOIN assignments a ON ls.assignment_id = a.id
    JOIN users u ON ls.teacher_id = u.id
    WHERE ls.id = ?
  `).get(sessionId) as any;

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
    return NextResponse.json({ error: 'You are not enrolled in this class' }, { status: 403 });
  }

  // Get participant info
  const participation = db.prepare(`
    SELECT * FROM live_session_participants
    WHERE live_session_id = ? AND user_id = ?
  `).get(sessionId, authResult.user.id);

  // Parse state snapshot
  const state = session.state_snapshot_json ? JSON.parse(session.state_snapshot_json) : null;

  return NextResponse.json({
    session: {
      ...session,
      state
    },
    participation: participation || null
  });
};
