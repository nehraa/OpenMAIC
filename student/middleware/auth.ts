import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { setCurrentTenant } from '@/lib/db';
import type { User } from '../../shared/types/roles';

export interface AuthContext {
  user: User;
  tenantId: string;
}

// Middleware that validates JWT from cookie and adds user to request context
export function withAuth(
  handler: (req: NextRequest, ctx: AuthContext) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const accessToken = req.cookies.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let payload;
    try {
      payload = await verifyAccessToken(accessToken);
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const tenantId = (payload as any).tenantId;

    // Set tenant context for RLS
    if (tenantId) {
      await setCurrentTenant(tenantId);
    }

    const user: User = {
      id: payload.userId,
      role: payload.role as User['role'],
      phone_e164: '',
      name: '',
      status: 'active',
      created_at: '',
      updated_at: '',
    };

    return handler(req, { user, tenantId: tenantId || '' });
  };
}