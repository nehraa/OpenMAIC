import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { withTenant } from '@/lib/db';

interface NotificationRow {
  id: string;
  assignment_id: string | null;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

// GET /api/student/notifications
// Returns the student's notifications, newest first. ?unread=1 filters to
// unread only. The page-side render uses this to badge the bell icon and
// list items; future email/SMS transports will read from the same rows.
export const GET = async (request: NextRequest) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = requireRole(authResult.user, ['student_classroom', 'student_b2c']);
  if (roleCheck) return roleCheck;

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unread') === '1';

  const result = await withTenant(authResult.tenantId, async (client) => {
    return client.query<NotificationRow>(
      `SELECT id, assignment_id, type, title, body, read_at, created_at
       FROM notifications
       WHERE student_id = $1 ${unreadOnly ? 'AND read_at IS NULL' : ''}
       ORDER BY created_at DESC
       LIMIT 50`,
      [authResult.user.id]
    );
  });

  return NextResponse.json({
    notifications: result.rows,
    unread_count: unreadOnly
      ? result.rows.length
      : result.rows.filter(n => n.read_at === null).length,
  });
};

// PATCH /api/student/notifications
// Body: { id: string } marks a single notification read.
//       { mark_all_read: true } marks every unread notification read.
export const PATCH = async (request: NextRequest) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = requireRole(authResult.user, ['student_classroom', 'student_b2c']);
  if (roleCheck) return roleCheck;

  const body = await request.json().catch(() => null) as { id?: string; mark_all_read?: boolean } | null;
  if (!body || (!body.id && !body.mark_all_read)) {
    return NextResponse.json({ error: 'id or mark_all_read required' }, { status: 400 });
  }

  await withTenant(authResult.tenantId, async (client) => {
    if (body.mark_all_read) {
      await client.query(
        `UPDATE notifications SET read_at = NOW()
         WHERE student_id = $1 AND read_at IS NULL`,
        [authResult.user.id]
      );
    } else if (body.id) {
      await client.query(
        `UPDATE notifications SET read_at = NOW()
         WHERE student_id = $1 AND id = $2 AND read_at IS NULL`,
        [authResult.user.id, body.id]
      );
    }
  });

  return NextResponse.json({ ok: true });
};