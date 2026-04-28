import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = await verifyAccessToken(accessToken);

    return NextResponse.json({
      user: {
        id: payload.userId,
        tenantId: payload.tenantId,
        role: payload.role,
      },
    });
  } catch (error) {
    // Token is invalid or expired
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}