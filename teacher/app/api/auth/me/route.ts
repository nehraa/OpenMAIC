import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const sessionId = request.headers.get('x-session-id');

  if (!sessionId) {
    return NextResponse.json({ error: 'No session provided' }, { status: 401 });
  }

  const session = getSession(sessionId);

  if (!session) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
  }

  return NextResponse.json({ user: session.user });
}
