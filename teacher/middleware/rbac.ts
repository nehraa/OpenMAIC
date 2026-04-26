import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthContext } from './auth';
import type { UserRole } from '@shared/types/roles';

// Wrapper that adds role checking to auth - compatible with Next.js 16 route handlers
export function withRole(
  allowedRoles: UserRole[],
  handler: (req: NextRequest, ctx: AuthContext) => Promise<NextResponse>
) {
  return withAuth(async (req: NextRequest, ctx: AuthContext): Promise<NextResponse> => {
    if (!allowedRoles.includes(ctx.user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    return handler(req, ctx);
  });
}
