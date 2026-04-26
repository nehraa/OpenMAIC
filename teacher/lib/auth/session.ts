import type { User } from '@shared/types/roles';

export interface Session {
  id: string;
  user: User;
  issued_at: string;
  expires_at: string;
}

// In-memory session store (will be replaced with actual session management)
const sessions = new Map<string, Session>();

export function getSession(sessionId: string): Session | null {
  const session = sessions.get(sessionId);
  if (!session) {
    return null;
  }

  // Check expiration
  if (new Date(session.expires_at) < new Date()) {
    sessions.delete(sessionId);
    return null;
  }

  return session;
}

export function createSession(sessionId: string, user: User, ttlMs: number = 24 * 60 * 60 * 1000): Session {
  const now = new Date();
  const session: Session = {
    id: sessionId,
    user,
    issued_at: now.toISOString(),
    expires_at: new Date(now.getTime() + ttlMs).toISOString(),
  };
  sessions.set(sessionId, session);
  return session;
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}
