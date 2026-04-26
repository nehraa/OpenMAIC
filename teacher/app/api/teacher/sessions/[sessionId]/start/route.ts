import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/middleware/auth';

// POST /api/teacher/sessions/[sessionId]/start - Change status to 'live', sets started_at
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

  // Check if session is in 'draft' status
  if (session.status !== 'draft') {
    return NextResponse.json({ error: 'Only draft sessions can be started' }, { status: 400 });
  }

  // Check for other live sessions in the same class
  const liveSession = db.prepare(`
    SELECT id FROM classroom_sessions
    WHERE class_id = ? AND status = 'live'
  `).get(session.class_id) as any;

  if (liveSession) {
    return NextResponse.json({ error: 'Another session is already live for this class' }, { status: 409 });
  }

  // Start the session
  db.prepare(`
    UPDATE classroom_sessions
    SET status = 'live', started_at = datetime('now')
    WHERE id = ?
  `).run(sessionId);

  const updatedSession = db.prepare('SELECT * FROM classroom_sessions WHERE id = ?').get(sessionId);

  return NextResponse.json({ session: updatedSession });
});
