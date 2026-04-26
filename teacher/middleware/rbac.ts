import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthContext } from './auth';
import type { UserRole } from '@shared/types/roles';

// Route handler type that supports params from Next.js App Router
// Using any for routeContext to allow flexible param types across routes
type RouteHandler = (
  req: NextRequest,
  context: AuthContext,
  routeContext?: any
) => Promise<NextResponse>;

export function withRole(
  allowedRoles: UserRole[],
  handler: RouteHandler
) {
  return async (req: NextRequest, ctx: AuthContext, routeContext: { params: Promise<{ [key: string]: string }> }) => {
    if (!allowedRoles.includes(ctx.user.role)) {
      return NextResponse.json(
        { error: 'Access denied. Insufficient permissions.' },
        { status: 403 }
      );
    }

    // Forward all arguments to the handler including routeContext (params)
    // routeContext is passed by Next.js for dynamic routes
    return handler(req, ctx, routeContext);
  };
}