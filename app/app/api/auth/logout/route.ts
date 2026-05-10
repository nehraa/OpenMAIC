import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { verifyRefreshToken } from '../../../lib/auth/jwt';

export async function OPTIONS(_request: NextRequest) {
  const allowedOrigin = process.env.ACCESS_CONTROL_ALLOW_ORIGIN || 'http://localhost:3001';
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh_token')?.value;

    const db = getDb();

    // If we have a refresh token, try to invalidate the session
    if (refreshToken) {
      try {
        const tokenPayload = await verifyRefreshToken(refreshToken);
        const userId = tokenPayload.userId;
        const sessionId = tokenPayload.sessionId;

        // Find the session for this refresh token and revoke it
        await db.query(
          `UPDATE auth_sessions
            SET is_revoked = TRUE, revoked_at = NOW()
            WHERE id = $1
            AND user_id = $2
            AND is_revoked = FALSE
            AND expires_at > NOW()`,
          [sessionId, userId]
        );
      } catch {
        // Token is invalid/expired - nothing to revoke server-side
        // The cookie will expire naturally
      }
    }

    // Clear the cookies
    const cookieDomain = process.env.SESSION_COOKIE_DOMAIN;
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
      path: '/',
    };

    const response = NextResponse.json({ success: true });

    // Add CORS headers
    const allowedOrigin = process.env.ACCESS_CONTROL_ALLOW_ORIGIN || 'http://localhost:3001';
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    // Clear access token
    response.cookies.set('access_token', '', {
      ...cookieOptions,
      maxAge: 0,
    });

    // Clear refresh token
    response.cookies.set('refresh_token', '', {
      ...cookieOptions,
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    // Even on error, try to clear cookies
    const cookieDomain = process.env.SESSION_COOKIE_DOMAIN;
    const response = NextResponse.json({ success: true });

    response.cookies.set('access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      ...(cookieDomain ? { domain: cookieDomain } : {}),
      path: '/',
      maxAge: 0,
    });

    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      ...(cookieDomain ? { domain: cookieDomain } : {}),
      path: '/',
      maxAge: 0,
    });

    return response;
  }
}
