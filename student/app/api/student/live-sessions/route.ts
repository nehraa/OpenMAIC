import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { getDb } from '@/lib/db';

// GET /api/student/live-sessions
// Get all live sessions available to the student
export const GET = async (request: NextRequest) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = requireRole(authResult.user, ['student_classroom', 'student_b2c']);
  if (roleCheck) return roleCheck;

  const db = getDb();
  const studentId = authResult.user.id;

  // Get live sessions for assignments assigned to this student
  const sessions = db.prepare(`
    SELECT ls.id,
           a.title as assignment_title,
           u.name as teacher_name,
           ls.status,
           ls.started_at,
           ls.state_snapshot_json
    FROM live_sessions ls
    JOIN assignments a ON ls.assignment_id = a.id
    JOIN users u ON ls.teacher_id = u.id
    JOIN assignment_recipients ar ON a.id = ar.assignment_id
    WHERE ar.student_id = ?
      AND ls.status = 'live'
    ORDER BY ls.started_at DESC
  `).all(studentId);

  const sessionsWithState = sessions.map((s: any) => ({
    id: s.id,
    assignment_title: s.assignment_title,
    teacher_name: s.teacher_name,
    status: s.status,
    started_at: s.started_at,
    state: s.state_snapshot_json ? JSON.parse(s.state_snapshot_json) : null,
  }));

  return NextResponse.json({ sessions: sessionsWithState });
};
