import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { getDb, withTenant } from '@/lib/db';

interface ClassRow {
  id: string;
  name: string;
  join_code: string;
  teacher_id: string;
  tenant_id: string;
  [key: string]: unknown;
}

interface MembershipRow {
  id: string;
  class_id: string;
  student_id: string;
  source: string;
  joined_at: string;
  [key: string]: unknown;
}

// POST /api/student/join-class
// Body: { join_code: string }
// Allows an already-authenticated student to join an additional class.
//
// Cross-tenant lookup: the class belongs to another teacher's tenant, so we
// resolve it via getDb() (superuser bypasses RLS) to read the class's
// tenant_id, then run the membership write inside that tenant context.
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

  // Cross-tenant class lookup — must bypass RLS to find any teacher's class by join code.
  const classResult = await db.query<ClassRow>(
    `SELECT c.*, u.tenant_id
     FROM classes c
     JOIN users u ON c.teacher_id = u.id
     WHERE c.join_code = $1`,
    [join_code.toUpperCase()]
  );
  const classRow = classResult.rows[0];
  if (!classRow) {
    return NextResponse.json({ error: 'Invalid join code' }, { status: 400 });
  }

  const { membership, alreadyEnrolled } = await withTenant(classRow.tenant_id, async (client) => {
    const existingMembershipResult = await client.query<MembershipRow>(
      `SELECT * FROM class_memberships
       WHERE class_id = $1 AND student_id = $2`,
      [classRow.id, authResult.user.id]
    );
    const existing = existingMembershipResult.rows[0];
    if (existing) {
      return { membership: existing, alreadyEnrolled: true };
    }

    // Self-joins are pending until the teacher approves. The teacher-add
    // route continues to insert 'active' directly.
    const insertResult = await client.query<MembershipRow>(
      `INSERT INTO class_memberships (class_id, student_id, source, status)
       VALUES ($1, $2, 'manual', 'pending')
       RETURNING *`,
      [classRow.id, authResult.user.id]
    );
    return { membership: insertResult.rows[0], alreadyEnrolled: false };
  });

  return NextResponse.json(
    { class: classRow, membership, already_enrolled: alreadyEnrolled },
    { status: alreadyEnrolled ? 200 : 201 }
  );
};