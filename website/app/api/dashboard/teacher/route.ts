import { NextResponse } from 'next/server';
import { teacherDashboard } from '@/app/lib/mock-data';

export async function GET() {
  // In production, this would verify the session/token and fetch data for the authenticated teacher
  return NextResponse.json({
    success: true,
    data: teacherDashboard,
  });
}
