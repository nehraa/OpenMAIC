import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/middleware/auth';

// GET /api/teacher/students/[studentId] - Get student detail with classes and assignments
export const GET = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { studentId } = await routeCtx.params;
  const db = getDb();

  // Get student info - must be in teacher's class
  const studentResult = await db.query(`
    SELECT u.id, u.name, u.phone_e164, u.status, u.created_at
    FROM users u
    JOIN class_memberships cm ON u.id = cm.student_id
    JOIN classes c ON cm.class_id = c.id
    WHERE u.id = $1 AND c.teacher_id = $2 AND u.role = 'student_classroom'
  `, [studentId, ctx.user.id]);

  if (studentResult.rows.length === 0) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  const student = studentResult.rows[0];

  // Get student's classes
  const classesResult = await db.query(`
    SELECT c.id, c.name, c.subject, c.batch, cm.enrolled_at
    FROM classes c
    JOIN class_memberships cm ON c.id = cm.class_id
    WHERE cm.student_id = $1 AND c.teacher_id = $2
    ORDER BY cm.enrolled_at DESC
  `, [studentId, ctx.user.id]);

  // Get student's assignment progress
  const assignmentsResult = await db.query(`
    SELECT a.id, a.title, a.status, a.due_at, ar.visibility_status, ar.completion_status
    FROM assignments a
    JOIN assignment_recipients ar ON a.id = ar.assignment_id
    JOIN classes c ON a.class_id = c.id
    WHERE ar.student_id = $1 AND c.teacher_id = $2
    ORDER BY a.created_at DESC
  `, [studentId, ctx.user.id]);

  return NextResponse.json({
    student: {
      ...student,
      classes: classesResult.rows,
      assignments: assignmentsResult.rows
    }
  });
});
