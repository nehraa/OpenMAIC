import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { withTenant } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = requireRole(authResult.user, ['student_classroom', 'student_b2c']);
    if (roleCheck) return roleCheck;

    const userId = authResult.user.id;
    const tenantId = authResult.tenantId;

    const { classIds, lessons } = await withTenant(tenantId, async (client) => {
      const classesResult = await client.query<{ class_id: string }>(
        `SELECT cm.class_id
         FROM class_memberships cm
         JOIN classes c ON c.id = cm.class_id
         WHERE cm.student_id = $1`,
        [userId]
      );
      const classIds = classesResult.rows.map((r) => r.class_id);
      if (classIds.length === 0) {
        return { classIds: [] as string[], lessons: [] as unknown[] };
      }
      const placeholders = classIds.map((_, i) => `$${i + 2}`).join(',');
      const lessonsResult = await client.query(
        `SELECT l.id, l.title, l.description, l.duration_minutes,
                c.name as class_name,
                COALESCE(lp.status, 'not_started') as status,
                lp.completed_at
         FROM lessons l
         JOIN classes c ON c.id = l.class_id
         LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.student_id = $1
         WHERE l.class_id IN (${placeholders})
         ORDER BY l.created_at DESC`,
        [userId, ...classIds]
      );
      return { classIds, lessons: lessonsResult.rows };
    });

    if (classIds.length === 0) {
      return NextResponse.json({ lessons: [] });
    }

    return NextResponse.json({ lessons });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}