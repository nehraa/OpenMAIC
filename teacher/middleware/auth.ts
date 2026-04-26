import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import type { User } from '@shared/types/roles';

export interface AuthContext {
  user: User;
}

export function withAuth(
  handler: (
    req: NextRequest,
    context: AuthContext
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const sessionId = req.headers.get('x-session-id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const session = getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    return handler(req, { user: session.user });
  };
}