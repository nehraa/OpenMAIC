import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { getDb } from '@/lib/db';

// GET /api/student/assignments
// Get all assignments for the authenticated student
export const GET = async (request: NextRequest) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = requireRole(authResult.user, ['student_classroom', 'student_b2c']);
  if (roleCheck) return roleCheck;

  const db = getDb();
  const studentId = authResult.user.id;

  // Get assignments that are assigned to this student via assignment_recipients
  // Also get their completion status from assignment_attempts
  const assignments = db.prepare(`
    SELECT a.id,
           a.title,
           c.name as class_name,
           a.due_at,
           ar.visibility_status,
           aa.completion_state,
           aa.submitted_at,
           aa.score_percent
    FROM assignments a
    JOIN assignment_recipients ar ON a.id = ar.assignment_id
    JOIN classes c ON a.class_id = c.id
    LEFT JOIN assignment_attempts aa ON a.id = aa.assignment_id AND aa.student_id = ar.student_id
    WHERE ar.student_id = ?
      AND a.status IN ('released', 'closed')
    ORDER BY
      CASE
        WHEN aa.completion_state = 'submitted' THEN 2
        WHEN aa.completion_state = 'graded' THEN 2
        WHEN a.due_at < NOW() THEN 0
        WHEN a.due_at < NOW() + INTERVAL '24 hours' THEN 1
        ELSE 3
      END,
      a.due_at ASC NULLS LAST
  `).all(studentId);

  // Transform to include status
  const assignmentsWithStatus = assignments.map((a: any) => {
    let status: 'pending' | 'in_progress' | 'completed' = 'pending';

    if (a.completion_state === 'submitted' || a.completion_state === 'graded') {
      status = 'completed';
    } else if (a.completion_state === 'in_progress') {
      status = 'in_progress';
    } else if (a.due_at && new Date(a.due_at) < new Date()) {
      status = 'completed'; // Overdue but not submitted - show as pending for now
    }

    return {
      id: a.id,
      title: a.title,
      class_name: a.class_name,
      due_at: a.due_at,
      status,
      visibility_status: a.visibility_status,
      submitted_at: a.submitted_at,
      score_percent: a.score_percent,
    };
  });

  return NextResponse.json({ assignments: assignmentsWithStatus });
};
