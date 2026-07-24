import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { withTenant } from '@/lib/db';

interface ClassRow {
  id: string;
  name: string;
  subject: string;
  teacher_name: string;
  enrolled_at: string;
  batch: string;
  join_code: string | null;
}

// GET /api/student/classes/[classId]
// Single class detail for the authenticated student. Returns 404 if the
// student is not enrolled.
export const GET = async (
  request: NextRequest,
  context: { params: Promise<{ classId: string }> }
) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = requireRole(authResult.user, ['student_classroom', 'student_b2c']);
  if (roleCheck) return roleCheck;

  const { classId } = await context.params;
  if (!classId) {
    return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
  }

  const result = await withTenant(authResult.tenantId, async (client) => {
    return client.query<ClassRow>(
      `SELECT c.id,
              c.name,
              c.subject,
              c.batch,
              c.join_code,
              u.name  as teacher_name,
              cm.enrolled_at
       FROM classes c
       JOIN class_memberships cm ON c.id = cm.class_id
       JOIN users u ON c.teacher_id = u.id
       WHERE c.id = $1
         AND cm.student_id = $2
       LIMIT 1`,
      [classId, authResult.user.id]
    );
  });

  const row = result.rows[0];
  if (!row) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  return NextResponse.json({ class: row });
};
