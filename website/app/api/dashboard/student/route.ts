import { NextRequest, NextResponse } from 'next/server';
import { studentDashboards, students } from '@/app/lib/mock-data';

export async function GET(request: NextRequest) {
  // In production, this would get student ID from session/token
  const searchParams = request.nextUrl.searchParams;
  const studentId = searchParams.get('studentId');

  // Default to first student for demo purposes
  const targetStudentId = studentId || 'student-001';
  const dashboard = studentDashboards[targetStudentId];

  if (!dashboard) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Student dashboard not found' } },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: dashboard,
  });
}
