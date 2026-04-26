import { getDb } from '../db';
import type { User } from '@shared/types/roles';

const SESSION_EXPIRY_DAYS = 7;

export function createSession(userId: string): string {
  const db = getDb();
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO auth_sessions (id, user_id, issued_at, expires_at)
    VALUES (?, ?, datetime('now'), ?)
  `).run(sessionId, userId, expiresAt);

  return sessionId;
}

export function getSession(sessionId: string): { user: User } | null {
  const db = getDb();

  const session = db.prepare(`
    SELECT s.*, u.id as user_id, u.role, u.phone_e164, u.name, u.status, u.created_at, u.updated_at
    FROM auth_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > datetime('now') AND u.status = 'active'
  `).get(sessionId) as any;

  if (!session) {
    return null;
  }

  return {
    user: {
      id: session.user_id,
      role: session.role,
      phone_e164: session.phone_e164,
      name: session.name,
      status: session.status,
      created_at: session.created_at,
      updated_at: session.updated_at,
    },
  };
}

export function deleteSession(sessionId: string): void {
  const db = getDb();
  db.prepare('DELETE FROM auth_sessions WHERE id = ?').run(sessionId);
}
