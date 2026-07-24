import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { generateAccessToken } from '@/lib/auth/jwt';
import type { User } from '@shared/types/roles';

// GET /api/auth/sso?token=... — consume a session_id minted by the parent
// login API (or the teacher's own login API). Both apps share the
// `auth_sessions` table, so a parent's session row is a valid teacher session
// as long as it hasn't expired and the user is active.
//
// On success: plants `access_token` (JWT, 15 min) on the teacher domain so
// the page-level middleware lets the user through to /teacher. The client
// `/teacher/auth/sso` page still sets localStorage as a backup for client-side API
// calls, but the cookie is what unblocks middleware-driven page navigations.
//
// Returns 200 with { session_id, user } on success, 400 if the token is
// missing or malformed, 401 if the session is unknown/expired.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  // Tokens are UUIDs (per the parent's `crypto.randomUUID()` and the
  // teacher's own `crypto.randomUUID()` in createSession). Reject anything
  // that isn't a UUID up front so a stray string doesn't hit the DB.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
  }

  const result = await getSession(token);
  if (!result) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
  }

  // getSession returns the user but not tenant_id. Look it up so we can
  // mint a JWT carrying the same claims the parent's login API does.
  const db = getDb();
  const tenantRow = await db.query<{ tenant_id: string }>(
    `SELECT tenant_id FROM users WHERE id = $1`,
    [result.user.id]
  );
  const tenantId = tenantRow.rows[0]?.tenant_id;
  if (!tenantId) {
    return NextResponse.json({ error: 'User has no tenant' }, { status: 401 });
  }

  const accessToken = await generateAccessToken(
    result.user.id,
    tenantId,
    result.user.role
  );

  const cookieDomain = process.env.SESSION_COOKIE_DOMAIN;
  const response = NextResponse.json({
    session_id: token,
    user: result.user satisfies User,
  });
  response.cookies.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    ...(cookieDomain ? { domain: cookieDomain } : {}),
    path: '/',
    maxAge: 15 * 60,
  });

  return response;
}
