import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { createSession } from '@/lib/auth/session';
import { getAllowedOrigin, sessionCookieOptions } from '@/lib/auth/http';

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

export async function OPTIONS(_request: NextRequest) {
  const allowedOrigin = getAllowedOrigin();
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

export async function POST(request: NextRequest) {
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

    // Find user by email
    const userResult = await db.query(
      `SELECT id, role, name, email, phone_e164, password_hash, status, tenant_id
       FROM users WHERE email = $1`,
      [email]
    );
    const user = userResult.rows[0] as UserRow | undefined;

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password using timing-safe bcrypt comparison
    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check user status
    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 403 }
      );
    }

    // Get user's tenant (tenant_id is stored on the user record)
    const tenantId = user.tenant_id;

    // Generate tokens
    const accessToken = await generateAccessToken(
      user.id,
      tenantId,
      user.role
    );
    const refreshToken = await generateRefreshToken(user.id);

    // Create a DB session so the standalone teacher client (which auths via
    // x-session-id from localStorage) has a session_id to send on the next
    // request. Without this, the page stores nothing in localStorage,
    // redirects to /teacher, the library fetch 401s, and the user bounces
    // straight back to /login/teacher.
    const sessionId = await createSession(user.id);

    // Set cookies - domain only when explicitly configured for production
    const cookieOptions = sessionCookieOptions();

    const response = NextResponse.json({
      session_id: sessionId,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone_e164: user.phone_e164,
        role: user.role,
        status: user.status,
      },
    });

    // Add CORS headers - use env for production
    const allowedOrigin = getAllowedOrigin();
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.append('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.append('Access-Control-Allow-Headers', 'Content-Type');

    response.cookies.set('access_token', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60, // 15 minutes
    });

    response.cookies.set('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Echo the session id back as a response header too, matching the
    // /api/auth/verify-otp contract — keeps the client code path simple.
    response.headers.set('x-session-id', sessionId);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}