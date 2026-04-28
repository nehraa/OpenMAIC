import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { updateSessionState, getSessionById } from '@/lib/server/live-sessions';
import { z } from 'zod';

const UpdateStateSchema = z.object({
  currentSlideIndex: z.number().int().min(0).optional(),
  totalSlides: z.number().int().min(0).optional(),
  slideContent: z.string().optional()
});

// PATCH /api/teacher/live-sessions/[sessionId]/state - Update session state
export const PATCH = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { sessionId } = await routeCtx.params;

  const body = await req.json();
  const parsed = UpdateStateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const session = await getSessionById(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (session.teacher_id !== ctx.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  if (session.status === 'ended') {
    return NextResponse.json({ error: 'Cannot update ended session' }, { status: 400 });
  }

  const updatedSession = await updateSessionState(sessionId, parsed.data);

  return NextResponse.json({ session: updatedSession });
});
