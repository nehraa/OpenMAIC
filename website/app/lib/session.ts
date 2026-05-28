// DB-backed authentication using Prisma
import { prisma } from './prisma';
import { signToken, type TokenPayload } from './auth';
import bcrypt from 'bcryptjs';
import type { UserRole } from '@prisma/client';

// Map uppercase role to lowercase DB role
const roleToDbRole: Record<string, UserRole> = {
  TEACHER: 'teacher',
  STUDENT_CLASSROOM: 'student_classroom',
};

// Map lowercase DB role to uppercase JWT role
const dbRoleToJwtRole: Record<UserRole, TokenPayload['role']> = {
  teacher: 'TEACHER',
  student_classroom: 'STUDENT_CLASSROOM',
};

export async function authenticateUser(
  email: string,
  password: string,
  role: 'TEACHER' | 'STUDENT_CLASSROOM'
) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.passwordHash) {
    return { success: false as const, error: 'INVALID_CREDENTIALS' };
  }

  // Verify the user's role matches the requested role
  if (user.role !== roleToDbRole[role]) {
    return { success: false as const, error: 'INVALID_CREDENTIALS' };
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    return { success: false as const, error: 'INVALID_CREDENTIALS' };
  }

  const token = await signToken({
    userId: user.id,
    role: dbRoleToJwtRole[user.role],
    tenantId: user.tenantId,
    email: user.email ?? undefined,
  });

  return {
    success: true as const,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    },
    token,
  };
}