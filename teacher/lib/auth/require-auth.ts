import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from './jwt';
import type { User } from '@shared/types/roles';

export interface AuthResult {
  user: User;
  tenantId: string;
}

interface TokenPayload {
  userId: string;
  tenantId: string;
  role: string;
}

// Extract and validate auth from request using JWT in httpOnly cookies
export async function requireAuth(
  request: NextRequest
): Promise<AuthResult | NextResponse> {
  const accessToken = request.cookies.get('access_token')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const payload = await verifyAccessToken(accessToken);

    return {
      user: {
        id: payload.userId,
        role: payload.role as User['role'],
        phone_e164: '', // Not needed from JWT
        name: '', // Not needed from JWT
        status: 'active',
        created_at: '',
        updated_at: '',
      },
      tenantId: payload.tenantId,
    };
  } catch {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}

// Require specific roles - call after requireAuth
export function requireRole(
  user: User,
  allowedRoles: string[]
): NextResponse | null {
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }
  return null;
}