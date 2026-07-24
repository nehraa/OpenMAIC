import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { withTenant } from '@/lib/db';

// GET /api/student/classes
// Get all classes the student is enrolled in via class_memberships
export const GET = async (request: NextRequest) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = requireRole(authResult.user, ['student_classroom', 'student_b2c']);
  if (roleCheck) return roleCheck;

  const result = await withTenant(authResult.tenantId, async (client) => {
    return client.query(
      `SELECT c.*,
              u.name as teacher_name,
              cm.enrolled_at,
              cm.source,
              cm.status as membership_status
       FROM classes c
       JOIN class_memberships cm ON c.id = cm.class_id
       JOIN users u ON c.teacher_id = u.id
       WHERE cm.student_id = $1
       ORDER BY
         CASE cm.status
           WHEN 'pending' THEN 0
           WHEN 'active' THEN 1
           WHEN 'restricted' THEN 2
           WHEN 'rejected' THEN 3
           ELSE 4
         END,
         cm.enrolled_at DESC`,
      [authResult.user.id]
    );
  });

  return NextResponse.json({ classes: result.rows });
};
