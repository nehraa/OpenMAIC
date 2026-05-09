import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '../../../lib/db';
import { generateAccessToken, generateRefreshToken } from '../../../lib/auth/jwt';

const loginSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  userId: z.string().uuid().optional(), // Client-generated UUID for returning users
});

interface UserRow {
  id: string;
  role: string;
  name: string;
  phone_e164: string;
  status: string;
  tenant_id: string;
}

export async function OPTIONS(_request: NextRequest) {
  const allowedOrigin = process.env.ACCESS_CONTROL_ALLOW_ORIGIN || 'http://localhost:3001';
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

    const { name, userId: clientUserId } = validation.data;
    const db = getDb();

    // Generate a placeholder phone for individual users
    // The phone_e164 is used as a unique identifier - format: individual_<uuid>@aidutech.local
    const placeholderPhoneBase = `individual_${clientUserId || 'anon'}`;

    // Check if an individual user with this phone already exists
    const existingUserResult = await db.query(
      `SELECT id, role, name, phone_e164, status, tenant_id
       FROM users WHERE phone_e164 LIKE $1`,
      [`${placeholderPhoneBase}%`]
    );

    let userId: string;
    let tenantId: string;
    let user: UserRow;
    const isNewUser = existingUserResult.rows.length === 0;

    if (!isNewUser) {
      // User exists - use it (pick first match)
      user = existingUserResult.rows[0] as UserRow;
      userId = user.id;
      tenantId = user.tenant_id;

      // Update name if changed
      if (user.name !== name) {
        await db.query(
          `UPDATE users SET name = $1, updated_at = datetime('now') WHERE id = $2`,
          [name, userId]
        );
        user = { ...user, name };
      }
    } else {
      // Create a new tenant for this individual
      tenantId = crypto.randomUUID();

      // Create the tenant with pending owner first
      await db.query(
        `INSERT INTO tenants (id, owner_user_id, name, type)
         VALUES ($1, 'pending', $2, 'personal')`,
        [tenantId, `${name}'s Workspace`]
      );

      // Create individual user with role 'student_b2c' (B2C individual learner)
      userId = crypto.randomUUID();
      const actualPhone = clientUserId
        ? `${placeholderPhoneBase}@aidutech.local`
        : `individual_${userId}@aidutech.local`;

      await db.query(
        `INSERT INTO users (id, tenant_id, role, name, phone_e164, status)
         VALUES ($1, $2, 'student_b2c', $3, $4, 'active')`,
        [userId, tenantId, name, actualPhone]
      );

      // Update tenant owner to this user
      await db.query(
        `UPDATE tenants SET owner_user_id = $1 WHERE id = $2`,
        [userId, tenantId]
      );

      user = {
        id: userId,
        role: 'student_b2c',
        name,
        phone_e164: actualPhone,
        status: 'active',
        tenant_id: tenantId,
      };
    }

    // Generate tokens
    const accessToken = await generateAccessToken(
      userId,
      tenantId,
      'student_b2c'
    );
    const refreshToken = await generateRefreshToken(userId);

    // Set cookies - domain should be configurable for production
    const cookieDomain = process.env.SESSION_COOKIE_DOMAIN || 'localhost';
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      domain: cookieDomain,
      path: '/',
    };

    const response = NextResponse.json({
      user: {
        id: userId,
        name: user.name,
        phone_e164: user.phone_e164,
        role: user.role,
        status: user.status,
      },
      isNewUser,
    });

    // Add CORS headers
    const allowedOrigin = process.env.ACCESS_CONTROL_ALLOW_ORIGIN || 'http://localhost:3001';
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.append('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.append('Access-Control-Allow-Headers', 'Content-Type');

    // Set JWT tokens as httpOnly cookies
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
    console.error('Individual login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
