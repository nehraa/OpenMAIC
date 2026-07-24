import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateAccessToken } from '@/lib/auth/jwt';

interface SsoUserRow {
  id: string;
  tenant_id: string;
  role: string;
  name: string;
  email: string;
  phone_e164: string;
  status: string;
}

// Consume a parent-app auth_sessions ID and mint a host-local JWT cookie for
// study.devstudios.me. Cookies from openmaic.devstudios.me cannot cross to the
// student hostname, so this explicit SSO handoff is required.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
  }

  const result = await getDb().query<SsoUserRow>(
    `SELECT u.id, u.tenant_id, u.role, u.name, u.email, u.phone_e164, u.status
     FROM auth_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = $1
       AND s.expires_at > NOW()
       AND COALESCE(s.is_revoked, FALSE) = FALSE`,
    [token],
  );
  const user = result.rows[0];
  if (!user || user.status !== 'active') {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
  }
  if (user.role !== 'student_classroom' && user.role !== 'student_b2c') {
    return NextResponse.json({ error: 'This session is not a student account' }, { status: 403 });
  }

  const accessToken = await generateAccessToken(user.id, user.tenant_id, user.role);
  const response = NextResponse.json({
    session_id: token,
    user: {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      phone_e164: user.phone_e164,
      status: user.status,
    },
  });

  // Deliberately host-only. A Domain=openmaic.devstudios.me cookie would be
  // rejected by browsers when emitted from study.devstudios.me.
  response.cookies.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60,
  });
  return response;
}
