import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { sessionCookieOptions } from '@/lib/auth/http';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

interface UserRow {
  id: string;
  role: string;
  name: string;
  email: string;
  phone_e164: string;
  status: string;
  password_hash: string;
  tenant_id: string;
}

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    const db = getDb();

    const userResult = await db.query(
      `SELECT id, role, name, email, phone_e164, password_hash, status, tenant_id
       FROM users WHERE email = $1`,
      [email]
    );
    const user = userResult.rows[0] as UserRow | undefined;

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Account is not active' }, { status: 403 });
    }

    if (user.role !== 'student_classroom' && user.role !== 'student_b2c') {
      return NextResponse.json(
        { error: 'This login is for student accounts only' },
        { status: 403 }
      );
    }

    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const accessToken = await generateAccessToken(user.id, user.tenant_id, user.role);
    const refreshToken = await generateRefreshToken(user.id);

    const response = NextResponse.json({
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        phone_e164: user.phone_e164,
        status: user.status,
      },
    });

    // Use the shared cookie options so the cookie is marked `secure` in
    // production and the `domain` attribute is only set when an operator
    // has explicitly configured SESSION_COOKIE_DOMAIN. The previous call
    // site left both unset, which shipped cookies without the Secure flag
    // in production and pinned them to the default host.
    const cookieOptions = sessionCookieOptions();

    response.cookies.set('access_token', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60,
    });
    response.cookies.set('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('[student/auth/login] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};
