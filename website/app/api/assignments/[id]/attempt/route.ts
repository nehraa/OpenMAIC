import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getSession } from '@/app/lib/auth';

// POST: Start or resume an attempt
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'STUDENT_CLASSROOM') {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    }

    const { id } = await params;

    // Check if attempt already exists (resume)
    const existing = await prisma.assignmentAttempt.findUnique({
      where: { assignment_attempts_assignment_id_student_id_key: { assignmentId: id, studentId: session.userId } },
    });

    if (existing) {
      return NextResponse.json({ success: true, data: existing });
    }

    // Create new attempt
    const attempt = await prisma.assignmentAttempt.create({
      data: {
        tenantId: session.tenantId,
        assignmentId: id,
        studentId: session.userId,
        completionState: 'in_progress',
      },
    });

    // Update recipient visibility
    await prisma.assignmentRecipient.update({
      where: { assignment_recipients_assignment_id_student_id_key: { assignmentId: id, studentId: session.userId } },
      data: { visibilityStatus: 'visible' },
    });

    return NextResponse.json({ success: true, data: attempt }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR' } }, { status: 500 });
  }
}

// PATCH: Submit an attempt with score
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'STUDENT_CLASSROOM') {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { scorePercent, answersJson } = body;

    if (scorePercent === undefined) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'scorePercent is required' } },
        { status: 400 }
      );
    }

    const attempt = await prisma.assignmentAttempt.update({
      where: { assignment_attempts_assignment_id_student_id_key: { assignmentId: id, studentId: session.userId } },
      data: {
        scorePercent,
        answersJson: answersJson ? JSON.stringify(answersJson) : null,
        submittedAt: new Date(),
        completionState: 'submitted',
      },
    });

    await prisma.assignmentRecipient.update({
      where: { assignment_recipients_assignment_id_student_id_key: { assignmentId: id, studentId: session.userId } },
      data: { visibilityStatus: 'completed' },
    });

    return NextResponse.json({ success: true, data: attempt });
  } catch (error) {
    return NextResponse.json({ error: { code: 'SERVER_ERROR' } }, { status: 500 });
  }
}