import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { endSession, getSessionById } from '@/lib/server/live-sessions';

// POST /api/teacher/live-sessions/[sessionId]/end - End a live session
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { sessionId } = await routeCtx.params;

  const session = await getSessionById(sessionId);
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
    const updatedSession = await endSession(sessionId);
    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to end session';
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
