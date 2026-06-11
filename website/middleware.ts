import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/app/lib/auth';

const PROTECTED_ROUTES = ['/dashboard/teacher', '/dashboard/student'];
const AUTH_ROUTES = ['/login/teacher', '/login/student', '/login/individual'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (!isProtected && !isAuthRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;
  let payload = null;
  try {
    payload = token ? await verifyToken(token) : null;
  } catch {
    payload = null;
  }

  if (isProtected && !payload) {
    const redirectTo = pathname.startsWith('/dashboard/teacher')
      ? '/login/teacher'
      : '/login/student';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  if (isAuthRoute && payload) {
    const redirectTo =
      payload.role === 'TEACHER' ? '/dashboard/teacher' : '/dashboard/student';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login/:path*'],
};