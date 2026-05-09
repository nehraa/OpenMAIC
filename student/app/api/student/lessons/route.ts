import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = requireRole(authResult.user, ['student_classroom', 'student_b2c']);
    if (roleCheck) return roleCheck;

    const db = getDb();
    const userId = authResult.user.id;

    // Get student's enrolled classes
    const classesResult = await db.query(`
      SELECT cm.class_id, c.name as class_name, c.subject
      FROM class_memberships cm
      JOIN classes c ON c.id = cm.class_id
      WHERE cm.student_id = $1
    `, [userId]);

    const classIds = classesResult.rows.map(r => r.class_id);

    if (classIds.length === 0) {
      return NextResponse.json({ lessons: [] });
    }

    // Get lessons for enrolled classes - use placeholders for IN clause
    const placeholders = classIds.map((_, i) => `$${i + 2}`).join(',');
    const lessonsResult = await db.query(`
      SELECT l.id, l.title, l.description, l.duration_minutes,
             c.name as class_name,
             COALESCE(lp.status, 'not_started') as status,
             lp.completed_at
      FROM lessons l
      JOIN classes c ON c.id = l.class_id
      LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.student_id = $1
      WHERE l.class_id IN (${placeholders})
      ORDER BY l.created_at DESC
    `, [userId, ...classIds]);

    return NextResponse.json({ lessons: lessonsResult.rows });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}