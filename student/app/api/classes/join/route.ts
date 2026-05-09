import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { inviteCode } = await request.json()

    if (!inviteCode) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 })
    }

    // Mock validation - in production this would check against database
    const validCodes: Record<string, { classId: string; className: string; teacherName: string }> = {
      'ABCD-EFGH-IJKL': { classId: 'class-1', className: 'Mathematics 10A', teacherName: 'Mr. Smith' },
      'TEST-CODE-1234': { classId: 'class-2', className: 'Science 10B', teacherName: 'Ms. Johnson' },
    }

    const codeData = validCodes[inviteCode.toUpperCase()]

    if (!codeData) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 })
    }

    return NextResponse.json({
      classId: codeData.classId,
      className: codeData.className,
      teacherName: codeData.teacherName,
    })
  } catch (error) {
    console.error('Failed to join class:', error)
    return NextResponse.json({ error: 'Failed to join class' }, { status: 500 })
  }
}