import { NextRequest, NextResponse } from 'next/server';

/** Convert string to Uint8Array */
function encode(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/** Convert ArrayBuffer to hex string */
function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Verify an HMAC-signed token using Web Crypto API (Edge-compatible) */
async function verifyToken(token: string, accessCode: string): Promise<boolean> {
  const dotIndex = token.indexOf('.');
  if (dotIndex === -1) return false;

  const timestamp = token.substring(0, dotIndex);
  const signature = token.substring(dotIndex + 1);

  const keyData = encode(accessCode);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const data = encode(timestamp);
  const expected = bufToHex(await crypto.subtle.sign('HMAC', key, data.buffer as ArrayBuffer));

  if (signature.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessCode = process.env.ACCESS_CODE;

  // Whitelist: static assets, _next, api/access-code, health, login
  if (
    pathname.startsWith('/api/access-code/') ||
    pathname === '/api/health' ||
    // Classroom share URLs are public and use unguessable IDs. Their server
    // and teacher preview clients both read the same payload through this GET
    // endpoint; keep writes protected.
    (pathname === '/api/classroom' && request.method === 'GET') ||
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/logos') ||
    pathname.startsWith('/login/') ||
    pathname === '/login'
  ) {
    return NextResponse.next();
  }

  // Access code check (existing logic)
  if (accessCode) {
    const cookie = request.cookies.get('openmaic_access');
    if (cookie?.value && (await verifyToken(cookie.value, accessCode))) {
      return NextResponse.next();
    }

    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, errorCode: 'INVALID_REQUEST', error: 'Access code required' },
        { status: 401 },
      );
    }
  }

  // Role cookie check for non-API routes
  if (!pathname.startsWith('/api/') && process.env.REQUIRE_ROLE === 'true') {
    const role = request.cookies.get('aidutech_role')?.value;
    if (role !== 'individual') {
      // Redirect to the public landing page where users pick teacher/student/individual
      const landingUrl = process.env.LANDING_URL || 'https://openmaic.devstudios.me';
      const loginUrl = new URL(landingUrl);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logos).*)'],
};
