import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';

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

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:3001',
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
      `SELECT id, role, name, email, phone_e164, password_hash, status
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

    // Set cookies with domain=localhost for cross-app sharing
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      domain: 'localhost',
      path: '/',
    };

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone_e164: user.phone_e164,
        role: user.role,
        status: user.status,
      },
    });

    // Add CORS headers for cross-origin requests from app (port 3001)
    response.headers.set('Access-Control-Allow-Origin', 'http://localhost:3001');
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