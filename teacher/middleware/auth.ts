import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, type TokenPayload } from '@/lib/auth/jwt';
import { getDb } from '@/lib/db';
import type { User } from '@shared/types/roles';

export interface AuthContext {
  user: User;
  tenantId: string;
}

type RouteContext = { params: Promise<Record<string, string>> };

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
    let tenantId: string | null = null;

    if (accessToken) {
      try {
        const payload = await verifyAccessToken(accessToken);
        userId = payload.userId;
        tenantId = (payload as any).tenantId;
      } catch {
        // Fall back to session ID if access token is invalid
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
        tenantId = sessionResult.rows[0].tenant_id;
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
      tenantId: user.tenant_id
    }, routeCtx);
  };
}
