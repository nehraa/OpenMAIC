import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import type { User } from '../../shared/types/roles';

export interface AuthContext {
  user: User;
}

type NextAppHandler = (
  request: NextRequest,
  context: { params: Promise<{ [key: string]: string }> }
) => void | Response | Promise<void | Response>;

// Middleware that adds auth user to request context
export function withAuth(
  handler: (req: NextRequest, ctx: AuthContext) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const sessionId = req.headers.get('x-session-id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const session = getSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    return handler(req, { user: session.user });
  };
}
