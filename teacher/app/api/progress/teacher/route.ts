import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const classId = searchParams.get('classId')
  const dateRange = searchParams.get('dateRange') || 'month'

  const students = [
    { id: '1', name: 'Alice Johnson', className: 'Mathematics 10A', completionRate: 85, avgQuizScore: 88, lastActive: new Date().toISOString() },
    { id: '2', name: 'Bob Smith', className: 'Mathematics 10A', completionRate: 72, avgQuizScore: 75, lastActive: new Date().toISOString() },
  ]

  return NextResponse.json({
    students,
    stats: { totalStudents: 45, avgCompletion: 72, avgQuizScore: 78, avgTimeMinutes: 45 },
    classes: [{ id: 'class-1', name: 'Mathematics 10A' }],
  })
}
