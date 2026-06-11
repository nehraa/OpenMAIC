import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getSession } from '@/app/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'TEACHER') {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    }

    const { id } = await params;

    // Verify teacher owns this assignment
    const assignment = await prisma.assignment.findFirst({
      where: { id, teacherId: session.userId },
    });
    if (!assignment) {
      return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
    }

    const recipients = await prisma.assignmentRecipient.findMany({
      where: { assignmentId: id },
      include: { student: true },
    });

    const attempts = await prisma.assignmentAttempt.findMany({
      where: { assignmentId: id },
    });

    const attemptMap = new Map(attempts.map((a) => [a.studentId, a]));

    const data = recipients.map((r) => {
      const attempt = attemptMap.get(r.studentId);
      return {
        studentId: r.student.id,
        name: r.student.name,
        avatar: r.student.name
          .split(' ')
          .filter(Boolean)
          .map((n: string) => n[0])
          .join('')
          .slice(0, 2),
        color: 'teal' as const,
        status: r.visibilityStatus,
        score: attempt?.scorePercent ?? null,
        submittedAt: attempt?.submittedAt?.toISOString() ?? null,
        startedAt: attempt?.startedAt?.toISOString() ?? null,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR' } }, { status: 500 });
  }
}