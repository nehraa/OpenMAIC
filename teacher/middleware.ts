import { NextRequest, NextResponse } from 'next/server';

// URL-level auth lock for the teacher app.
//
// Every page route except the public auth surface (`/login`, `/login/teacher`,
// `/auth/sso`) requires a valid `access_token` cookie. API routes are
// intentionally excluded — they have their own guards (`requireAuth` in each
// handler). `/auth/sso` is the parent's one-click hand-off page; it must
// load without a cookie so the redirect chain can complete.
//
// In Next.js middleware, `pathname` does NOT include the basePath, so we
// match against the route path (e.g. `/auth/sso`), not the full URL.
//
// A missing token triggers a redirect to `/login?next=<original-path>` so
// the user returns to the page they were trying to reach after signing in.
// We deliberately do NOT validate the JWT signature here — middleware runs
// in the edge runtime and the verification path is shared with the API.
// The page renders, then client-side `/api/auth/me` confirms the session is
// still live and triggers a logout+redirect if not.
const PUBLIC_PATHS = new Set<string>(['/login', '/login/teacher', '/auth/sso']);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes — they enforce auth themselves.
  if (pathname.startsWith('/api/')) return NextResponse.next();

  // Skip Next.js internals and static assets.
  if (
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/public/')
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  const accessToken = request.cookies.get('access_token')?.value;
  if (accessToken) return NextResponse.next();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.search = `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};