import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '../../../lib/db';
import { verifyPassword } from '../../../lib/auth/password';
import { generateAccessToken, generateRefreshToken } from '../../../lib/auth/jwt';
import { checkRateLimit, clearRateLimit, rateLimitExceededResponse } from '../../../lib/auth/rate-limit';
import { hashRefreshToken } from '../../../lib/auth/refresh-token';

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

function getAllowedOrigin(): string {
  const allowedOrigin = process.env.ACCESS_CONTROL_ALLOW_ORIGIN;
  if (!allowedOrigin) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ACCESS_CONTROL_ALLOW_ORIGIN must be set in production');
    }
    return process.env.DEV_ORIGIN || 'http://localhost:3001';
  }
  return allowedOrigin;
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
    // Check rate limit
    const rateLimit = await checkRateLimit(request, 'login');
    if (!rateLimit.allowed) {
      return rateLimitExceededResponse(rateLimit.retryAfter);
    }

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

    // OTP-only users have password_hash set to NULL
    // They cannot login via password - must use OTP instead
    if (user.password_hash === null) {
      return NextResponse.json(
        { error: 'This account requires OTP authentication' },
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
    const sessionId = crypto.randomUUID();
    const refreshToken = await generateRefreshToken(user.id, sessionId);

    // Hash and store refresh token in session for rotation support
    const refreshTokenHash = hashRefreshToken(refreshToken);
    await db.query(
      `INSERT INTO auth_sessions (id, user_id, refresh_token_hash, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
      [sessionId, user.id, refreshTokenHash]
    );

    await clearRateLimit(request, 'login');

    // Set cookies
    const cookieDomain = process.env.SESSION_COOKIE_DOMAIN;
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
      path: '/',
    };

    // session_id is the auth_sessions row id. The standalone teacher reads
    // the same shared `auth_sessions` table, so handing this back lets the
    // login page SSO into the teacher in one click instead of a 2nd login.
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

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
