import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken } from '../../../lib/auth/jwt';
import { getDb } from '../../../lib/db';
import { generateAccessToken, generateRefreshToken } from '../../../lib/auth/jwt';
import { hashRefreshToken, verifyRefreshTokenHash } from '../../../lib/auth/refresh-token';

const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

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
    const refreshToken = request.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token required' },
        { status: 401 }
      );
    }

    // Verify the JWT structure and expiry
    let tokenPayload: { userId: string; sessionId: string };
    try {
      tokenPayload = await verifyRefreshToken(refreshToken);
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    const db = getDb();
    const userId = tokenPayload.userId;

    // Find the exact session associated with this refresh token
    const sessionResult = await db.query(
      `SELECT id, refresh_token_hash, token_family, token_version, is_revoked, replaced_by
       FROM auth_sessions
       WHERE id = $1 AND user_id = $2 AND expires_at > NOW()`,
      [tokenPayload.sessionId, userId]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 401 }
      );
    }

    const session = sessionResult.rows[0];

    // Check if this specific session's refresh token matches
    const isValidToken = Boolean(session.refresh_token_hash) &&
      verifyRefreshTokenHash(refreshToken, session.refresh_token_hash);

    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Check for replay attack - if this session was already used to get a new token
    if (session.replaced_by) {
      // This token was already used once - potential replay attack!
      // Invalidate the entire token family to prevent further abuse
      await db.query(
        `UPDATE auth_sessions
         SET is_revoked = TRUE, revoked_at = NOW()
         WHERE token_family = $1`,
        [session.token_family]
      );

      return NextResponse.json(
        { error: 'Token reuse detected. All sessions in this family have been revoked.' },
        { status: 401 }
      );
    }

    // Get user info for generating new tokens
    const userResult = await db.query(
      `SELECT id, role, name, email, phone_e164, status, tenant_id
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];

    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 403 }
      );
    }

    // Generate new tokens
    const newAccessToken = await generateAccessToken(
      user.id,
      user.tenant_id,
      user.role
    );
    const newSessionId = crypto.randomUUID();
    const newRefreshToken = await generateRefreshToken(user.id, newSessionId);
    const newRefreshTokenHash = hashRefreshToken(newRefreshToken);

    // Create a new session with the new refresh token
    await db.query(
      `INSERT INTO auth_sessions (id, user_id, refresh_token_hash, token_family, token_version, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '7 days')`,
      [newSessionId, userId, newRefreshTokenHash, session.token_family, session.token_version + 1]
    );

    // Mark the old session as replaced (so future use of old token is detected as replay)
    await db.query(
      `UPDATE auth_sessions SET replaced_by = $1 WHERE id = $2`,
      [newSessionId, session.id]
    );

    // Clean up old expired sessions (keep last 10 per user for debugging)
    await db.query(
      `DELETE FROM auth_sessions
       WHERE user_id = $1
       AND id NOT IN (
         SELECT id FROM auth_sessions
         WHERE user_id = $1
         ORDER BY issued_at DESC
         LIMIT 10
       )
       AND expires_at < NOW()`,
      [userId]
    );

    // Set cookies with new tokens
    const cookieDomain = process.env.SESSION_COOKIE_DOMAIN;
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
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

    // Add CORS headers
    const allowedOrigin = process.env.ACCESS_CONTROL_ALLOW_ORIGIN || 'http://localhost:3001';
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    response.cookies.set('access_token', newAccessToken, {
      ...cookieOptions,
      maxAge: 15 * 60, // 15 minutes
    });

    response.cookies.set('refresh_token', newRefreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_EXPIRY_SECONDS,
    });

    return response;
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
