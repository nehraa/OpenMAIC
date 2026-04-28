import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { getDb } from '@/lib/db';

// POST /api/student/join-class
// Body: { join_code: string }
// Allows an already-authenticated student to join an additional class
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

  // Find class by join code - get teacher_id for tenant context
  const classResult = await db.query(
    `SELECT c.*, u.tenant_id
     FROM classes c
     JOIN users u ON c.teacher_id = u.id
     WHERE c.join_code = $1`,
    [join_code.toUpperCase()]
  );
  const classRow = classResult.rows[0] as any;

  if (!classRow) {
    return NextResponse.json({ error: 'Invalid join code' }, { status: 400 });
  }

  const existingMembership = await db.query(
    `SELECT * FROM class_memberships
     WHERE class_id = $1 AND student_id = $2`,
    [classRow.id, authResult.user.id]
  );

  if (existingMembership.rows.length > 0) {
    return NextResponse.json({
      class: classRow,
      membership: existingMembership.rows[0],
      already_enrolled: true
    });
  }

  const membershipResult = await db.query(
    `INSERT INTO class_memberships (class_id, student_id, source)
     VALUES ($1, $2, 'manual')
     RETURNING *`,
    [classRow.id, authResult.user.id]
  );

  const membership = membershipResult.rows[0];

  return NextResponse.json({ class: classRow, membership }, { status: 201 });
};
