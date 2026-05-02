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
    const existingUser = await db.query(
      'SELECT * FROM users WHERE phone_e164 = $1',
      [phone]
    );
    let user = existingUser.rows[0] as any;

    if (!user) {
      // Create new user
      await db.query(
        `INSERT INTO users (role, phone_e164, name) VALUES ($1, $2, $3)`,
        [role, phone, name || '']
      );

      // Re-query to get the created user
      const newUser = await db.query(
        'SELECT * FROM users WHERE phone_e164 = $1',
        [phone]
      );
      user = newUser.rows[0] as any;
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
