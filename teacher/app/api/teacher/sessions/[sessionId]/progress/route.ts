import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/middleware/auth';

// GET /api/teacher/sessions/[sessionId]/progress - Get session progress with participants and questions
export const GET = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { sessionId } = await routeCtx.params;
  const db = getDb();

  // Get the session and verify ownership
  const sessionResult = await db.query(`
    SELECT cs.*, c.teacher_id as class_teacher_id
    FROM classroom_sessions cs
    JOIN classes c ON cs.class_id = c.id
    WHERE cs.id = $1
  `, [sessionId]);

  if (sessionResult.rows.length === 0) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const session = sessionResult.rows[0] as any;

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
      await db.query(`
        UPDATE classroom_sessions
        SET status = 'ended', ended_at = NOW()
        WHERE id = $1
      `, [sessionId]);

      session.status = 'ended';
      session.ended_at = new Date().toISOString();
    }
  }

  // Get participants
  const participantsResult = await db.query(`
    SELECT sp.*, u.name, u.phone_e164
    FROM session_participants sp
    JOIN users u ON sp.user_id = u.id
    WHERE sp.session_id = $1
    ORDER BY sp.joined_at DESC
  `, [sessionId]);

  const participants = participantsResult.rows;

  // Calculate completion stats
  const totalParticipants = participants.length;
  const completedParticipants = participants.filter((p: any) => p.completion_state === 'completed').length;
  const pendingParticipants = totalParticipants - completedParticipants;

  const completionStats = {
    total: totalParticipants,
    completed: completedParticipants,
    pending: pendingParticipants,
    completion_rate: totalParticipants > 0 ? Math.round((completedParticipants / totalParticipants) * 100) : 0
  };

  // Get questions
  const questionsResult = await db.query(`
    SELECT qm.*, u.name as student_name
    FROM question_messages qm
    JOIN users u ON qm.student_id = u.id
    WHERE qm.session_id = $1
    ORDER BY qm.created_at DESC
  `, [sessionId]);

  // Get updated session
  const updatedSessionResult = await db.query('SELECT * FROM classroom_sessions WHERE id = $1', [sessionId]);

  return NextResponse.json({
    session: updatedSessionResult.rows[0],
    participants,
    completion_stats: completionStats,
    questions: questionsResult.rows
  });
});
