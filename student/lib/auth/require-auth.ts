import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import type { User } from '../../../shared/types/roles';

export interface AuthResult {
  user: User;
  sessionId: string;
}

// Extract and validate auth from request - works in any route handler context
export async function requireAuth(request: NextRequest): Promise<AuthResult | NextResponse> {
  const sessionId = request.headers.get('x-session-id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const session = getSession(sessionId);

  if (!session) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
  }

  return { user: session.user, sessionId };
}

// Require specific roles - call after requireAuth
export function requireRole(user: User, allowedRoles: string[]): NextResponse | null {
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }
  return null;
}
