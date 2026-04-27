import { NextRequest, NextResponse } from 'next/server';

// Middleware to reject teacher role on student routes
export function studentRoleGuard(
  handler: (
    req: NextRequest,
    context: { user: { id: string; role: string } }
  ) => Promise<NextResponse>
) {
  return async (
    req: NextRequest,
    context: { user: { id: string; role: string } }
  ): Promise<NextResponse> => {
    // Reject teacher role
    if (context.user.role === 'teacher') {
      return NextResponse.json({ error: 'Access denied. Teachers cannot access student routes.' }, { status: 403 });
    }

    return handler(req, context);
  };
}
