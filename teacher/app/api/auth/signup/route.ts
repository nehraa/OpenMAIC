import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Phone must be in E.164 format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

interface UserRow {
  id: string;
}

interface TenantRow {
  id: string;
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
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, phone, password } = validation.data;
    const db = getDb();

    // Check if email already exists
    const existingEmailResult = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    const existingEmail = existingEmailResult.rows[0] as UserRow | undefined;

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Check if phone already exists
    const existingPhoneResult = await db.query(
      'SELECT id FROM users WHERE phone_e164 = $1',
      [phone]
    );
    const existingPhone = existingPhoneResult.rows[0] as UserRow | undefined;

    if (existingPhone) {
      return NextResponse.json(
        { error: 'Phone already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create tenant first for this teacher (without owner_user_id initially)
    const tenantId = crypto.randomUUID();
    await db.query(
      `INSERT INTO tenants (id, name, type)
       VALUES ($1, $2, 'personal')`,
      [tenantId, `${name}'s Workspace`]
    );

    // Create user with tenant_id
    const userId = crypto.randomUUID();
    await db.query(
      `INSERT INTO users (id, tenant_id, role, name, email, phone_e164, password_hash, status)
       VALUES ($1, $2, 'teacher', $3, $4, $5, $6, 'active')`,
      [userId, tenantId, name, email, phone, passwordHash]
    );

    // Update tenant with correct owner_user_id
    await db.query(
      `UPDATE tenants SET owner_user_id = $1 WHERE id = $2`,
      [userId, tenantId]
    );

    // Generate tokens
    const accessToken = await generateAccessToken(userId, tenantId, 'teacher');
    const refreshToken = await generateRefreshToken(userId);

    // Set cookies with domain=localhost for cross-app sharing
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      domain: 'localhost',
      path: '/',
    };

    const response = NextResponse.json(
      {
        user: {
          id: userId,
          name,
          email,
          phone_e164: phone,
          role: 'teacher',
          status: 'active',
        },
      },
      { status: 201 }
    );

    // Add CORS headers for cross-origin requests from app (port 3001)
    response.headers.set('Access-Control-Allow-Origin', 'http://localhost:3001');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    response.cookies.set('access_token', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60, // 15 minutes in seconds
    });

    response.cookies.set('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}