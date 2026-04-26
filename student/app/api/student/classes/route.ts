import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { getDb } from '@/lib/db';

// GET /api/student/classes
// Get all classes the student is enrolled in via class_memberships
export const GET = async (request: NextRequest) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = requireRole(authResult.user, ['student_classroom', 'student_b2c']);
  if (roleCheck) return roleCheck;

  const db = getDb();

  const classes = db.prepare(`
    SELECT c.*,
           u.name as teacher_name,
           cm.enrolled_at,
           cm.source
    FROM classes c
    JOIN class_memberships cm ON c.id = cm.class_id
    JOIN users u ON c.teacher_id = u.id
    WHERE cm.student_id = ?
    ORDER BY cm.enrolled_at DESC
  `).all(authResult.user.id);

  return NextResponse.json({ classes });
};
