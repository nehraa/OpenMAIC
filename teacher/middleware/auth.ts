import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, type TokenPayload } from '@/lib/auth/jwt';
import { getDb, setCurrentTenant } from '@/lib/db';
import type { User } from '@shared/types/roles';

export interface AuthContext {
  user: User;
  tenantId: string;
}

type RouteContext = { params: Promise<Record<string, string>> };

/**
 * Middleware that authenticates a request via either a JWT access token
 * (short-lived, 15 min) or a long-lived session cookie.
 *
 * JWT failure handling:
 * - `ERR_JWT_EXPIRED` is treated as benign: the access token is short-lived,
 *   so the session cookie can authenticate the user instead. This preserves
 *   the "stay logged in" UX across access-token rotations.
 * - All other JWT failures (tampering, bad signature, malformed, wrong
 *   issuer/audience, etc.) are rejected with 401 immediately. Silently
 *   falling through to the session lookup for those would mask token
 *   tampering and create an authentication bypass on any request that
 *   carries both a bogus access token and a valid session ID.
 *
 * @param handler - The protected route handler to invoke once authenticated.
 * @returns A Next.js route handler that returns 401 if no valid credentials
 *   are present, or the result of `handler` otherwise.
 */
export function withAuth(
  handler: (
    req: NextRequest,
    context: AuthContext,
    routeCtx: RouteContext
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, routeCtx: RouteContext = { params: Promise.resolve({}) }): Promise<NextResponse> => {
    // Check for JWT access token in cookies
    const accessToken = req.cookies.get('access_token')?.value;
    const sessionId = req.cookies.get('session_id')?.value || req.headers.get('x-session-id');

    let userId: string | null = null;

    if (accessToken) {
      try {
        const payload: TokenPayload = await verifyAccessToken(accessToken);
        userId = payload.userId;
      } catch (err) {
        // Distinguish "expired" from every other JWT failure. The string
        // `code` check is used (rather than `instanceof errors.JWTExpired`)
        // so the behavior is stable across `jose` minor upgrades.
        const isExpired = (err as { code?: string } | null)?.code === 'ERR_JWT_EXPIRED';
        if (!isExpired) {
          console.error('[auth] JWT verification failed:', err);
          return NextResponse.json(
            { error: 'Invalid token' },
            { status: 401 }
          );
        }
        // Expired access token: fall through to session lookup below.
      }
    }

    const db = getDb();

    if (!userId && sessionId) {
      // Check session in database
      const sessionResult = await db.query(
        `SELECT s.user_id, u.tenant_id 
         FROM auth_sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.id = $1 AND s.expires_at > NOW()`,
        [sessionId]
      );

      if (sessionResult.rows.length > 0) {
        userId = sessionResult.rows[0].user_id;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get full user from database
    const result = await db.query(
      `SELECT id, role, name, email, phone_e164, status, tenant_id
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    const user = result.rows[0] as User & { tenant_id: string };

    // Set tenant context for Postgres RLS policies. Uses the dedicated
    // connection that RLS checks `current_setting('app.current_tenant_id')`
    // against, so the rest of the request executes under that tenant scope.
    await setCurrentTenant(user.tenant_id);

    return handler(req, {
      user: {
        id: user.id,
        role: user.role as User['role'],
        phone_e164: user.phone_e164,
        name: user.name,
        status: user.status as User['status'],
        created_at: (user as any).created_at,
        updated_at: (user as any).updated_at,
      },
      tenantId: (user as any).tenant_id
    }, routeCtx);
  };
}
