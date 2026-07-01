import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { withTenant } from '@/lib/db';

interface AssignmentRow {
  id: string;
  title: string;
  class_name: string;
  due_at: string | null;
  visibility_status: string;
  completion_state: string | null;
  submitted_at: string | null;
  score_percent: number | null;
}

type AssignmentStatus = 'pending' | 'in_progress' | 'completed';

// GET /api/student/assignments
// Get all assignments for the authenticated student
export const GET = async (request: NextRequest) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = requireRole(authResult.user, ['student_classroom', 'student_b2c']);
  if (roleCheck) return roleCheck;

  const studentId = authResult.user.id;

  const result = await withTenant(authResult.tenantId, async (client) => {
    return client.query<AssignmentRow>(
      `SELECT a.id,
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
       WHERE ar.student_id = $1
         AND a.status IN ('released', 'closed')
       ORDER BY
         CASE
           WHEN aa.completion_state = 'submitted' THEN 2
           WHEN aa.completion_state = 'graded' THEN 2
           WHEN a.due_at < NOW() THEN 0
           WHEN a.due_at < NOW() + INTERVAL '24 hours' THEN 1
           ELSE 3
         END,
         a.due_at ASC NULLS LAST`,
      [studentId]
    );
  });

  const assignments = result.rows.map((a) => {
    let status: AssignmentStatus = 'pending';
    if (a.completion_state === 'submitted' || a.completion_state === 'graded') {
      status = 'completed';
    } else if (a.completion_state === 'in_progress') {
      status = 'in_progress';
    } else if (a.due_at && new Date(a.due_at) < new Date()) {
      status = 'pending'; // Overdue but not submitted
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

  return NextResponse.json({ assignments });
};