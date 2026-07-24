import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/server/middleware';
import type { AuthContext } from '@/lib/server/middleware/auth';
import { getWeaknessProfile } from '@/lib/server/progress';
import { getDb } from '@/lib/db';

// GET /api/teacher/progress/student/[studentId]/weakness?classId=...
// Aggregates per-question results across all of the student's attempts in
// the teacher's class. Bug #14 — without this, the teacher can't see which
// question types a student is weak on.
export const GET = withRole(
  ['teacher'],
  async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
    const { studentId } = await routeCtx.params;
    const url = new URL(req.url);
    const classId = url.searchParams.get('classId') || undefined;

    const db = getDb();
    const verifyResult = await db.query(
      `SELECT cm.id
       FROM class_memberships cm
       JOIN classes c ON c.id = cm.class_id
       WHERE cm.student_id = $1
         AND c.teacher_id = $2
         ${classId ? 'AND cm.class_id = $3' : ''}
       LIMIT 1`,
      classId ? [studentId, ctx.user.id, classId] : [studentId, ctx.user.id]
    );

    if (verifyResult.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const profile = await getWeaknessProfile(studentId, ctx.user.id, classId);
    if (!profile) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  }
);
