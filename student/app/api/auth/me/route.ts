import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { withTenant } from '@/lib/db';

interface TokenPayload {
  userId: string;
  tenantId: string;
  role: string;
}

interface StudentRow {
  id: string;
  role: string;
  phone_e164: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ClassRow {
  id: string;
  name: string;
  subject: string;
  batch: string;
  join_code: string;
  peer_visibility_enabled: boolean;
  enrolled_at: string;
  source: string;
}

/**
 * GET /api/auth/me
 * Returns current authenticated student info.
 */
export const GET = async (request: NextRequest) => {
  try {
    const accessToken = request.cookies.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = await verifyAccessToken(accessToken) as TokenPayload;

    // Students must have student_classroom role
    if (payload.role !== 'student_classroom') {
      return NextResponse.json(
        { error: 'Access denied. Student account required.' },
        { status: 403 }
      );
    }

    // Both the user lookup and the class lookup are tenant-scoped via RLS:
    // tenantId in the JWT is the teacher's id, which matches `users.tenant_id`
    // and the tenant boundary enforced by class_memberships.
    const data = await withTenant(payload.tenantId, async (client) => {
      const studentResult = await client.query<StudentRow>(
        `SELECT id, role, phone_e164, name, status, created_at, updated_at
         FROM users
         WHERE id = $1 AND role = 'student_classroom'`,
        [payload.userId]
      );
      const student = studentResult.rows[0];

      if (!student) {
        return { student: null, classes: [] as ClassRow[] };
      }

      const classesResult = await client.query<ClassRow>(
        `SELECT c.id, c.name, c.subject, c.batch, c.join_code, c.peer_visibility_enabled,
                cm.enrolled_at, cm.source
         FROM classes c
         JOIN class_memberships cm ON c.id = cm.class_id
         WHERE cm.student_id = $1
         ORDER BY cm.enrolled_at DESC`,
        [payload.userId]
      );

      return { student, classes: classesResult.rows };
    });

    if (!data.student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: data.student.id,
        name: data.student.name,
        phone_e164: data.student.phone_e164,
        role: data.student.role,
        status: data.student.status,
        created_at: data.student.created_at,
      },
      tenantId: payload.tenantId, // This is the teacherId
      classes: data.classes,
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
};
