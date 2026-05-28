import { NextResponse } from 'next/server';
import { getTeacherDashboard } from '@/app/lib/teacher-api';

export async function GET() {
  try {
    const data = await getTeacherDashboard();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    }
    console.error('Teacher dashboard error:', error);
    return NextResponse.json({ error: { code: 'SERVER_ERROR' } }, { status: 500 });
  }
}
