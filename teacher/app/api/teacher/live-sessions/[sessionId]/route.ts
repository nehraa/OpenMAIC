import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/middleware/auth';
import { getSessionWithParticipants, getSessionById } from '@/lib/server/live-sessions';

// GET /api/teacher/live-sessions/[sessionId] - Get session with participants
export const GET = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const sessionId = req.nextUrl.pathname.split('/').filter(Boolean).at(-1);
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  // Get the session and verify ownership
  const session = getSessionById(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (session.teacher_id !== ctx.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const sessionWithParticipants = getSessionWithParticipants(sessionId);

  return NextResponse.json({ session: sessionWithParticipants });
});
