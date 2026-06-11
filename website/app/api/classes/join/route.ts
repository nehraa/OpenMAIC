import { NextRequest, NextResponse } from 'next/server';
import { joinClassByCode } from '@/app/lib/class-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { joinCode } = body;

    if (!joinCode || typeof joinCode !== 'string') {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'joinCode is required' } },
        { status: 400 }
      );
    }

    const result = await joinClassByCode(joinCode.trim());
    return NextResponse.json({ success: true, data: result.class }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
      }
      if (error.message === 'CLASS_NOT_FOUND') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Class not found. Check the invite code.' } },
          { status: 404 }
        );
      }
      if (error.message === 'ALREADY_MEMBER') {
        return NextResponse.json(
          { error: { code: 'ALREADY_MEMBER', message: 'You are already in this class' } },
          { status: 409 }
        );
      }
    }
    return NextResponse.json({ error: { code: 'SERVER_ERROR' } }, { status: 500 });
  }
}