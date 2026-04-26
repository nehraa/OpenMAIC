import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthContext } from './auth';
import type { UserRole } from '@shared/types/roles';

export function withRole(
  allowedRoles: UserRole[],
  handler: (
    req: NextRequest,
    context: AuthContext
  ) => Promise<NextResponse>
) {
  return withAuth(async (req, ctx) => {
    if (!allowedRoles.includes(ctx.user.role)) {
      return NextResponse.json(
        { error: 'Access denied. Insufficient permissions.' },
        { status: 403 }
      );
    }

    return handler(req, ctx);
  });
}