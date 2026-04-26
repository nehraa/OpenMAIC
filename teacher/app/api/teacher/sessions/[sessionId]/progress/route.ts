import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/middleware/auth';

// GET /api/teacher/sessions/[sessionId]/progress - Get session progress with participants and questions
export const GET = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const sessionId = req.nextUrl.pathname.split('/').filter(Boolean).at(-2);
  const db = getDb();

  // Get the session and verify ownership
  const session = db.prepare(`
    SELECT cs.*, c.teacher_id as class_teacher_id
    FROM classroom_sessions cs
    JOIN classes c ON cs.class_id = c.id
    WHERE cs.id = ?
  `).get(sessionId) as any;

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (session.class_teacher_id !== ctx.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Auto-end check: if session has exceeded max_duration_minutes, treat as ended
  if (session.status === 'live' && session.started_at) {
    const startedAt = new Date(session.started_at);
    const maxDurationMs = session.max_duration_minutes * 60 * 1000;
    const now = new Date();

    if (now.getTime() > startedAt.getTime() + maxDurationMs) {
      // Auto-end the session
      db.prepare(`
        UPDATE classroom_sessions
        SET status = 'ended', ended_at = datetime('now')
        WHERE id = ?
      `).run(sessionId);

      session.status = 'ended';
      session.ended_at = new Date().toISOString();
    }
  }

  // Get participants
  const participants = db.prepare(`
    SELECT sp.*, u.name, u.phone_e164
    FROM session_participants sp
    JOIN users u ON sp.user_id = u.id
    WHERE sp.session_id = ?
    ORDER BY sp.joined_at DESC
  `).all(sessionId);

  // Calculate completion stats
  const totalParticipants = participants.length;
  const completedParticipants = (participants as any[]).filter(p => p.completion_state === 'completed').length;
  const pendingParticipants = totalParticipants - completedParticipants;

  const completionStats = {
    total: totalParticipants,
    completed: completedParticipants,
    pending: pendingParticipants,
    completion_rate: totalParticipants > 0 ? Math.round((completedParticipants / totalParticipants) * 100) : 0
  };

  // Get questions
  const questions = db.prepare(`
    SELECT qm.*, u.name as student_name
    FROM question_messages qm
    JOIN users u ON qm.student_id = u.id
    WHERE qm.session_id = ?
    ORDER BY qm.created_at DESC
  `).all(sessionId);

  // Get updated session
  const updatedSession = db.prepare('SELECT * FROM classroom_sessions WHERE id = ?').get(sessionId);

  return NextResponse.json({
    session: updatedSession,
    participants,
    completion_stats: completionStats,
    questions
  });
});
