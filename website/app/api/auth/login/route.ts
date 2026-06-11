import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/app/lib/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, userType } = body;

    if (!email || !password || !userType) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Email, password, and userType are required' } },
        { status: 400 }
      );
    }

    const role = userType === 'teacher' ? 'TEACHER' : 'STUDENT_CLASSROOM';
    const result = await authenticateUser(email, password, role);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: result.error, message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: result.user,
    });

    response.cookies.set('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'An error occurred during login' } },
      { status: 500 }
    );
  }
}