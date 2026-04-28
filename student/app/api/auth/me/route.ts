import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getDb } from '@/lib/db';
import type { User } from '@shared/types/roles';

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

    const db = getDb();

    // Get full student info from database
    const studentResult = await db.query(
      `SELECT id, role, phone_e164, name, status, created_at, updated_at
       FROM users
       WHERE id = $1 AND role = 'student_classroom'`,
      [payload.userId]
    );
    const student = studentResult.rows[0] as StudentRow | undefined;

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Get classes the student is enrolled in
    const classesResult = await db.query(
      `SELECT c.id, c.name, c.subject, c.batch, c.join_code, c.peer_visibility_enabled,
              cm.enrolled_at, cm.source
       FROM classes c
       JOIN class_memberships cm ON c.id = cm.class_id
       WHERE cm.student_id = $1
       ORDER BY cm.enrolled_at DESC`,
      [payload.userId]
    );

    return NextResponse.json({
      user: {
        id: student.id,
        name: student.name,
        phone_e164: student.phone_e164,
        role: student.role,
        status: student.status,
        created_at: student.created_at,
      },
      tenantId: payload.tenantId, // This is the teacherId
      classes: classesResult.rows,
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
};
