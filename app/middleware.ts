import { NextRequest, NextResponse } from 'next/server';

// Landing app middleware - allows all access since it's the public entry point
// Role selection and login pages are intentionally public

export async function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
