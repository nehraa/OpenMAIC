import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { getDb } from '@/lib/db';

// POST /api/student/join-class
// Body: { join_code: string }
export const POST = async (request: NextRequest) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = requireRole(authResult.user, ['student_classroom']);
  if (roleCheck) return roleCheck;

  const { join_code } = await request.json();

  if (!join_code || typeof join_code !== 'string') {
    return NextResponse.json({ error: 'Join code is required' }, { status: 400 });
  }

  const db = getDb();

  const classRow = db.prepare(`
    SELECT c.*, u.name as teacher_name
    FROM classes c
    JOIN users u ON c.teacher_id = u.id
    WHERE c.join_code = ?
  `).get(join_code.toUpperCase()) as any;

  if (!classRow) {
    return NextResponse.json({ error: 'Invalid join code' }, { status: 400 });
  }

  const existingMembership = db.prepare(`
    SELECT * FROM class_memberships
    WHERE class_id = ? AND student_id = ?
  `).get(classRow.id, authResult.user.id);

  if (existingMembership) {
    return NextResponse.json({
      class: classRow,
      membership: existingMembership,
      already_enrolled: true
    });
  }

  const result = db.prepare(`
    INSERT INTO class_memberships (class_id, student_id, source)
    VALUES (?, ?, 'manual')
  `).run(classRow.id, authResult.user.id);

  const membership = db.prepare('SELECT * FROM class_memberships WHERE id = ?').get(result.lastInsertRowid);

  return NextResponse.json({ class: classRow, membership }, { status: 201 });
};
