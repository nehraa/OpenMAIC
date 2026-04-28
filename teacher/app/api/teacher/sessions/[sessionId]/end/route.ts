import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/middleware/auth';

// POST /api/teacher/sessions/[sessionId]/end - Change status to 'ended', sets ended_at
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
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

  // Check if session is in 'live' status
  if (session.status !== 'live') {
    return NextResponse.json({ error: 'Only live sessions can be ended' }, { status: 400 });
  }

  // End the session
  await db.query(`
    UPDATE classroom_sessions
    SET status = 'ended', ended_at = NOW()
    WHERE id = $1
  `, [sessionId]);

  const updatedResult = await db.query('SELECT * FROM classroom_sessions WHERE id = $1', [sessionId]);

  return NextResponse.json({ session: updatedResult.rows[0] });
});
