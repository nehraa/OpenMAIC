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
    let user = db.prepare('SELECT * FROM users WHERE phone_e164 = ?').get(phone) as any;

    if (!user) {
      // Create new user - use returning() clause for TEXT primary key safety
      const insertResult = db.prepare(`
        INSERT INTO users (role, phone_e164, name)
        VALUES (?, ?, ?)
      `).run(role, phone, name || '');

      // For TEXT primary key, we must re-query since lastInsertRowid is numeric rowid
      user = db.prepare('SELECT * FROM users WHERE phone_e164 = ?').get(phone) as any;
    }

    // Create session
    const sessionId = createSession(user.id);

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
      },
    );
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
