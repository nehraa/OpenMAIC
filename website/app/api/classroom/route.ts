import { NextRequest, NextResponse } from 'next/server';
import { classroomData } from '@/app/lib/mock-data';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('sessionId') || 'classroom-001';

  // Return the classroom data with the requested session
  return NextResponse.json({
    success: true,
    data: {
      ...classroomData,
      sessionId,
    },
  });
}
