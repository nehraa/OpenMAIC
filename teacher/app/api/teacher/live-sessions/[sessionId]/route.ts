import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { getSessionWithParticipants, getSessionById } from '@/lib/server/live-sessions';

// GET /api/teacher/live-sessions/[sessionId] - Get session with participants
export const GET = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { sessionId } = await routeCtx.params;

  const session = await getSessionById(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (session.teacher_id !== ctx.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const sessionWithParticipants = await getSessionWithParticipants(sessionId);

  return NextResponse.json({ session: sessionWithParticipants });
});
