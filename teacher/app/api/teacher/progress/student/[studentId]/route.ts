import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { getStudentProgressEvents } from '@/lib/server/progress';
import { getDb } from '@/lib/db';

// GET /api/teacher/progress/student/[studentId]?classId=...&days=30
export const GET = withRole(
  ['teacher'],
  async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
    const { studentId } = await routeCtx.params;
    const url = new URL(req.url);
    const classId = url.searchParams.get('classId') || undefined;
    const days = Number(url.searchParams.get('days') || 30);

    // Verify the student belongs to one of the teacher's classes
    const db = getDb();
    const verifyResult = await db.query(
      `SELECT cm.id
       FROM class_memberships cm
       JOIN classes c ON c.id = cm.class_id
       WHERE cm.student_id = $1 AND c.teacher_id = $2
       LIMIT 1`,
      [studentId, ctx.user.id]
    );

    if (verifyResult.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const summary = await getStudentProgressEvents(studentId, classId, days);

    if (!summary) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ summary });
  }
);
