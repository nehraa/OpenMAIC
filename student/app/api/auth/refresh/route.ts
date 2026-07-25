import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateAccessToken, verifyRefreshToken } from '@/lib/auth/jwt';
import { sessionCookieOptions } from '@/lib/auth/http';

interface UserRow {
  id: string;
  tenant_id: string;
  role: string;
  status: string;
}

/**
 * POST /api/auth/refresh
 * Mints a fresh access_token from a valid refresh_token cookie.
 * Student JWTs only carry `userId` in the refresh payload, so we re-fetch
 * the user to read tenant_id and role before minting the new access token.
 */
export const POST = async (_request: NextRequest) => {
  const refreshToken = _request.cookies.get('refresh_token')?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: 'Refresh token required' }, { status: 401 });
  }

  let payload: { userId: string };
  try {
    payload = await verifyRefreshToken(refreshToken);
  } catch {
    return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
  }

  const result = await getDb().query<UserRow>(
    'SELECT id, tenant_id, role, status FROM users WHERE id = $1',
    [payload.userId],
  );
  const user = result.rows[0];
  if (!user || user.status !== 'active') {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }
  if (user.role !== 'student_classroom' && user.role !== 'student_b2c') {
    return NextResponse.json({ error: 'Student account required' }, { status: 403 });
  }

  const accessToken = await generateAccessToken(user.id, user.tenant_id, user.role);
  const cookieOptions = sessionCookieOptions();

  const response = NextResponse.json({ success: true });
  response.cookies.set('access_token', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60,
  });
  return response;
};
