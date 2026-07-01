import type { UserRole } from '../../shared/types/roles';
import type { AuthContext } from './auth';
import { NextResponse } from 'next/server';

// Require specific roles - use this at the top of a route handler
export function requireRole(ctx: AuthContext, allowedRoles: UserRole[]): NextResponse | null {
  if (!allowedRoles.includes(ctx.user.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }
  return null;
}
