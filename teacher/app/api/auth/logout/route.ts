import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  const sessionId = request.headers.get('x-session-id');

  if (!sessionId) {
    return NextResponse.json({ error: 'No session provided' }, { status: 401 });
  }

  deleteSession(sessionId);

  return NextResponse.json({ success: true });
}
