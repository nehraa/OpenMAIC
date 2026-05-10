import { NextRequest, NextResponse } from 'next/server';
import { teacher, students } from '@/app/lib/mock-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, userType } = body;

    // Mock validation - in production this would verify against a database
    if (!email || !password) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Email and password are required' } },
        { status: 400 }
      );
    }

    // Check for teacher login
    if (userType === 'teacher') {
      if (email === teacher.email) {
        return NextResponse.json({
          success: true,
          user: {
            id: teacher.id,
            name: teacher.name,
            email: teacher.email,
            avatar: teacher.avatar,
            color: teacher.color,
            userType: 'teacher',
            subject: teacher.subject,
            class: `${teacher.class} ${teacher.section}`,
          },
          token: 'mock-teacher-token-' + Date.now(),
        });
      }
    }

    // Check for student login
    if (userType === 'student') {
      const student = students.find((s) => s.email === email);
      if (student) {
        return NextResponse.json({
          success: true,
          user: {
            id: student.id,
            name: student.name,
            email: student.email,
            avatar: student.avatar,
            color: student.color,
            userType: 'student',
            class: `${student.class} ${student.section}`,
            rollNumber: student.rollNumber,
          },
          token: 'mock-student-token-' + Date.now(),
        });
      }
    }

    // Individual login (email-based lookup for either)
    const student = students.find((s) => s.email === email);
    if (student) {
      return NextResponse.json({
        success: true,
        user: {
          id: student.id,
          name: student.name,
          email: student.email,
          avatar: student.avatar,
          color: student.color,
          userType: 'student',
          class: `${student.class} ${student.section}`,
          rollNumber: student.rollNumber,
        },
        token: 'mock-student-token-' + Date.now(),
      });
    }

    // No match found
    return NextResponse.json(
      { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'An error occurred during login' } },
      { status: 500 }
    );
  }
}
