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
// API routes have their own auth guards — but we still block direct browser
// navigation to them when no token is present to keep behavior consistent.
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

  const response = PUBLIC_PATHS.has(pathname)
    ? NextResponse.next()
    : (() => {
        const accessToken = request.cookies.get('access_token')?.value;
        if (accessToken) return NextResponse.next();
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/login';
        loginUrl.search = `?next=${encodeURIComponent(pathname)}`;
        return NextResponse.redirect(loginUrl);
      })();

  // Apply security headers to API responses.
  if (pathname.startsWith('/api/')) {
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};