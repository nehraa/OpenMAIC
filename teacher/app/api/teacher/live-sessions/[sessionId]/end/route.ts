import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/middleware/auth';
import { endSession, getSessionById } from '@/lib/server/live-sessions';

// POST /api/teacher/live-sessions/[sessionId]/end - End a live session
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const sessionId = req.nextUrl.pathname.split('/').filter(Boolean).at(-2);
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  const db = getDb();

  // Get the session and verify ownership
  const session = getSessionById(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (session.teacher_id !== ctx.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  if (session.status === 'ended') {
    return NextResponse.json({ error: 'Session already ended' }, { status: 400 });
  }

  try {
    const updatedSession = endSession(sessionId);
    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to end session';
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
