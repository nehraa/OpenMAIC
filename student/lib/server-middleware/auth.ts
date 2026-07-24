import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import type { User } from '@shared/types/roles';

export interface AuthContext {
  user: User;
  tenantId: string;
}

interface JwtPayload {
  userId: string;
  role: string;
  tenantId?: string;
}

// Middleware that validates JWT from cookie and adds user to request context.
// Routes are responsible for scoping DB queries via `withTenant(tenantId, fn)`.
export function withAuth(
  handler: (req: NextRequest, ctx: AuthContext) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const accessToken = req.cookies.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let payload: JwtPayload;
    try {
      payload = (await verifyAccessToken(accessToken)) as JwtPayload;
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const tenantId = payload.tenantId ?? '';
    const user: User = {
      id: payload.userId,
      role: payload.role as User['role'],
      phone_e164: '',
      name: '',
      status: 'active',
      created_at: '',
      updated_at: '',
    };

    return handler(req, { user, tenantId });
  };
}