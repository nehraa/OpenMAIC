import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { generateAccessToken, generateRefreshToken } from '../../../lib/auth/jwt';
import { checkRateLimit, clearRateLimit, rateLimitExceededResponse } from '../../../lib/auth/rate-limit';
import { hashRefreshToken } from '../../../lib/auth/refresh-token';

const joinSchema = {
  parse: (data: unknown) => {
    const obj = data as Record<string, unknown>;
    if (!obj.joinCode || typeof obj.joinCode !== 'string') {
      return { success: false, error: 'Join code is required' };
    }
    if (!obj.phone || typeof obj.phone !== 'string') {
      return { success: false, error: 'Phone is required' };
    }
    if (!obj.name || typeof obj.name !== 'string') {
      return { success: false, error: 'Name is required' };
    }
    return { success: true, data: obj };
  }
};

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
    const validation = joinSchema.parse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { joinCode, phone, name } = validation.data as { joinCode: string; phone: string; name: string };
    const db = getDb();

    // Find class by join code
    const classResult = await db.query(
      'SELECT id, teacher_id, tenant_id FROM classes WHERE join_code = $1',
      [joinCode.toUpperCase()]
    );

    if (classResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid join code' }, { status: 404 });
    }

    const classRow = classResult.rows[0] as { id: string; teacher_id: string; tenant_id: string };

    // Check if user with this phone already exists
    const existingUserResult = await db.query(
      'SELECT id FROM users WHERE phone_e164 = $1',
      [phone]
    );

    let userId: string;
    let isNewUser = false;

    if (existingUserResult.rows.length > 0) {
      userId = existingUserResult.rows[0].id as string;
    } else {
      // Create new student user
      // Security: Students authenticate via OTP only, no password set
      // password_hash is NULL to indicate OTP-only authentication
      isNewUser = true;
      userId = crypto.randomUUID();

      await db.query(
        `INSERT INTO users (id, tenant_id, role, name, email, phone_e164, password_hash, status)
         VALUES ($1, $2, 'student_classroom', $3, NULL, $4, NULL, 'active')`,
        [userId, classRow.tenant_id, name, phone]
      );
    }

    // Check if already enrolled
    const existingMembershipResult = await db.query(
      'SELECT id FROM class_memberships WHERE class_id = $1 AND student_id = $2',
      [classRow.id, userId]
    );

    if (existingMembershipResult.rows.length === 0) {
      // Enroll student in class
      await db.query(
        `INSERT INTO class_memberships (id, tenant_id, class_id, student_id, source)
         VALUES ($1, $2, $3, $4, 'manual')`,
        [crypto.randomUUID(), classRow.tenant_id, classRow.id, userId]
      );
    }

    // A student may join after an assignment has already been released. Give
    // late joiners the same visible recipient rows as students who were
    // enrolled at release time.
    await db.query(
      `INSERT INTO assignment_recipients (tenant_id, assignment_id, student_id, visibility_status)
       SELECT assignment.tenant_id, assignment.id, $1, 'visible'
       FROM assignments AS assignment
       WHERE assignment.class_id = $2
         AND assignment.status IN ('released', 'closed')
       ON CONFLICT (assignment_id, student_id) DO NOTHING`,
      [userId, classRow.id]
    );

    // Generate auth tokens for immediate login
    const accessToken = await generateAccessToken(
      userId,
      classRow.tenant_id,
      'student_classroom'
    );
    const sessionId = crypto.randomUUID();
    const refreshToken = await generateRefreshToken(userId, sessionId);

    // Hash and store refresh token in session for rotation support
    const refreshTokenHash = hashRefreshToken(refreshToken);
    await db.query(
      `INSERT INTO auth_sessions (id, user_id, refresh_token_hash, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
      [sessionId, userId, refreshTokenHash]
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

    const response = NextResponse.json({
      success: true,
      session_id: sessionId,
      user: { id: userId, name, role: 'student_classroom' },
      classId: classRow.id,
      isNewUser
    });

    // Add CORS headers
    const allowedOrigin = getAllowedOrigin();
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');

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
    console.error('Join error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
