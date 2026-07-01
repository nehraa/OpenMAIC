import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/auth/otp';
import { createSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { phone, otp, name, role = 'teacher' } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 });
    }

    // Verify OTP
    if (!verifyOtp(phone, otp)) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
    }

    const db = getDb();

    // Find or create user
    interface UserRow {
      id: string;
      role: string;
      phone_e164: string;
      name: string;
    }
    const existingUser = await db.query<UserRow>(
      'SELECT id, role, phone_e164, name FROM users WHERE phone_e164 = $1',
      [phone]
    );
    let user: UserRow | undefined = existingUser.rows[0];

    if (!user) {
      // Create tenant for OTP user
      const tenantId = crypto.randomUUID();
      await db.query(
        `INSERT INTO tenants (id, name) VALUES ($1, $2)`,
        [tenantId, `${phone}'s Workspace`]
      );

      // Create new user - OTP users don't have passwords
      await db.query(
        `INSERT INTO users (tenant_id, role, phone_e164, name, password_hash, status) VALUES ($1, $2, $3, $4, $5, 'active')`,
        [tenantId, role, phone, name || '', 'otp_no_password']
      );

      // Re-query to get the created user
      const newUser = await db.query<UserRow>(
        'SELECT id, role, phone_e164, name FROM users WHERE phone_e164 = $1',
        [phone]
      );
      user = newUser.rows[0];
    }

    // Create session
    const sessionId = await createSession(user.id);

    return NextResponse.json(
      {
        session_id: sessionId,
        user: {
          id: user.id,
          role: user.role,
          phone_e164: user.phone_e164,
          name: user.name,
        },
      },
      {
        headers: {
          'x-session-id': sessionId,
        },
      }
    );
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
