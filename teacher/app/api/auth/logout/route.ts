import { NextRequest, NextResponse } from 'next/server';
import { sessionCookieOptions } from '@/lib/auth/http';

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({ success: true });

  // Clear both access and refresh tokens by setting them to empty with expired maxAge.
  // The cookie domain is only set when SESSION_COOKIE_DOMAIN is configured — a
  // hardcoded `localhost` domain would silently fail to clear production cookies.
  const cookieOptions = sessionCookieOptions();

  response.cookies.set('access_token', '', {
    ...cookieOptions,
    maxAge: 0,
  });

  response.cookies.set('refresh_token', '', {
    ...cookieOptions,
    maxAge: 0,
  });

  return response;
}