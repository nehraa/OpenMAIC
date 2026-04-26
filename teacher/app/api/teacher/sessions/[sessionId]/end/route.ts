import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/middleware/auth';

// POST /api/teacher/sessions/[sessionId]/end - Change status to 'ended', sets ended_at
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
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

  // Check if session is in 'live' status
  if (session.status !== 'live') {
    return NextResponse.json({ error: 'Only live sessions can be ended' }, { status: 400 });
  }

  // End the session
  db.prepare(`
    UPDATE classroom_sessions
    SET status = 'ended', ended_at = datetime('now')
    WHERE id = ?
  `).run(sessionId);

  const updatedSession = db.prepare('SELECT * FROM classroom_sessions WHERE id = ?').get(sessionId);

  return NextResponse.json({ session: updatedSession });
});
