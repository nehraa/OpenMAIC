import { NextRequest, NextResponse } from 'next/server';
import { createAssignment, getTeacherAssignments } from '@/app/lib/assignment-api';

export async function GET() {
  try {
    const assignments = await getTeacherAssignments();
    return NextResponse.json({ success: true, data: assignments });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    }
    return NextResponse.json({ error: { code: 'SERVER_ERROR' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, classId, dueAt, slideAssetVersionId, quizAssetVersionId } = body;

    if (!title || !description || !classId) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'title, description, classId are required' } },
        { status: 400 }
      );
    }

    const assignment = await createAssignment({
      title,
      description,
      classId,
      dueAt: dueAt ? new Date(dueAt) : undefined,
      slideAssetVersionId,
      quizAssetVersionId,
    });

    return NextResponse.json({ success: true, data: assignment }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'CLASS_NOT_FOUND') {
      return NextResponse.json({ error: { code: 'CLASS_NOT_FOUND' } }, { status: 404 });
    }
    return NextResponse.json({ error: { code: 'SERVER_ERROR' } }, { status: 500 });
  }
}