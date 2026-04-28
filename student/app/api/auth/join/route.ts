import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import type { User } from '@shared/types/roles';

const joinSchema = z.object({
  joinCode: z.string().min(1, 'Join code is required'),
  phone: z.string().min(1, 'Phone is required'),
  name: z.string().min(1, 'Name is required'),
});

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
  teacher_id: string;
  tenant_id: string;
  name: string;
  subject: string;
  batch: string;
  join_code: string;
  peer_visibility_enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * POST /api/auth/join
 * Student joins via a class join code and their phone number.
 * Flow:
 * 1. Find class by join code
 * 2. Check if student with phone exists in users table
 * 3. If not, create student user record (role = 'student_classroom')
 * 4. Create class_membership
 * 5. Generate JWT tokens (with student role and their teacher_id as tenant)
 * 6. Set httpOnly cookie
 * 7. Return student info
 */
export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const validation = joinSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { joinCode, phone, name } = validation.data;
    const normalizedPhone = phone.replace(/\D/g, '');
    const db = getDb();

    // Step 1: Find class by join code
    const classResult = await db.query(
      `SELECT c.*, u.tenant_id
       FROM classes c
       JOIN users u ON c.teacher_id = u.id
       WHERE c.join_code = $1`,
      [joinCode.toUpperCase()]
    );
    const classRow = classResult.rows[0] as (ClassRow & { tenant_id: string }) | undefined;

    if (!classRow) {
      return NextResponse.json(
        { error: 'Invalid join code' },
        { status: 400 }
      );
    }

    // Step 2: Check if student with phone exists
    const existingUserResult = await db.query(
      `SELECT id, role, phone_e164, name, status, created_at, updated_at
       FROM users
       WHERE phone_e164 = $1 AND role = 'student_classroom'`,
      [normalizedPhone]
    );
    let student: StudentRow;
    let isNewStudent = false;

    if (existingUserResult.rows.length > 0) {
      // Student exists, use them
      student = existingUserResult.rows[0] as StudentRow;
    } else {
      // Step 3: Create new student user
      isNewStudent = true;
      const newStudentResult = await db.query(
        `INSERT INTO users (tenant_id, role, phone_e164, name)
         VALUES ($1, 'student_classroom', $2, $3)
         RETURNING id, role, phone_e164, name, status, created_at, updated_at`,
        [classRow.tenant_id, normalizedPhone, name.trim()]
      );
      student = newStudentResult.rows[0] as StudentRow;
    }

    // Step 4: Create class_membership if not already a member
    const existingMembershipResult = await db.query(
      `SELECT id FROM class_memberships
       WHERE class_id = $1 AND student_id = $2`,
      [classRow.id, student.id]
    );

    if (existingMembershipResult.rows.length === 0) {
      await db.query(
        `INSERT INTO class_memberships (class_id, student_id, source)
         VALUES ($1, $2, 'manual')`,
        [classRow.id, student.id]
      );
    }

    // Step 5: Generate JWT tokens
    // tenantId is the teacherId for students
    const accessToken = await generateAccessToken(
      student.id,
      classRow.teacher_id, // teacher_id serves as tenant for students
      'student_classroom'
    );
    const refreshToken = await generateRefreshToken(student.id);

    // Step 6: Set httpOnly cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      domain: 'localhost',
      path: '/',
    };

    // Step 7: Return student info
    const response = NextResponse.json({
      user: {
        id: student.id,
        name: student.name,
        phone_e164: student.phone_e164,
        role: student.role,
        status: student.status,
        isNewStudent,
      },
      class: {
        id: classRow.id,
        name: classRow.name,
        subject: classRow.subject,
        teacherId: classRow.teacher_id,
      },
    });

    response.cookies.set('access_token', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60, // 15 minutes
    });

    response.cookies.set('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Join error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};
