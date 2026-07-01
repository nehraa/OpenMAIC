import { NextRequest, NextResponse } from 'next/server';

const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
} as const;

// URL-level auth lock + security headers for the main app service.
//
// Public routes: `/`, `/login/*`. Everything else requires `access_token`.
// API routes enforce auth themselves and must stay reachable from the
// login page (which fetches `/api/auth/request-otp` before a cookie
// exists), so the URL lock skips them. Security headers still apply.
const PUBLIC_PATHS = new Set<string>(['/', '/login', '/login/teacher', '/login/student', '/login/individual']);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next.js internals and static assets.
  if (
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/public/')
  ) {
    return NextResponse.next();
  }

  // API routes handle their own auth — leave them reachable.
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value;
  if (accessToken) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.search = `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};