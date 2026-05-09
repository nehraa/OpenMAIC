import { getDb } from '../db';
import type { User } from '@shared/types/roles';
import { SESSION_EXPIRY_DAYS } from '@shared/constants';

interface UserRow {
  id: string;
  u_id: string;
  role: string;
  phone_e164: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function createSession(userId: string): Promise<string> {
  const db = getDb();
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await db.query(`
    INSERT INTO auth_sessions (id, user_id, issued_at, expires_at)
    VALUES ($1, $2, NOW(), $3)
  `, [sessionId, userId, expiresAt]);

  return sessionId;
}

export async function getSession(sessionId: string): Promise<{ user: User } | null> {
  const db = getDb();

  const result = await db.query(`
    SELECT s.id, s.user_id, s.expires_at,
           u.id as u_id, u.role, u.phone_e164, u.name, u.status, u.created_at, u.updated_at
    FROM auth_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = $1 AND s.expires_at > $2 AND u.status = 'active'
  `, [sessionId, new Date().toISOString()]);

  if (result.rows.length === 0) {
    return null;
  }

  const session = result.rows[0] as UserRow & { expires_at: string };

  return {
    user: {
      id: session.u_id,
      role: session.role as User['role'],
      phone_e164: session.phone_e164,
      name: session.name,
      status: session.status as User['status'],
      created_at: session.created_at,
      updated_at: session.updated_at,
    }
  };
}

export async function deleteSession(sessionId: string): Promise<void> {
  const db = getDb();
  await db.query('DELETE FROM auth_sessions WHERE id = $1', [sessionId]);
}
