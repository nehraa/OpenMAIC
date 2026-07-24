import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';

// GET /api/student/access-code
// Returns the OpenMAIC room access code so the student can paste it into
// the classroom modal when they open a teacher's slide link. Mirrors the
// same env var the core classroom guard uses.
export const GET = async (request: NextRequest) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = requireRole(authResult.user, ['student_classroom', 'student_b2c']);
  if (roleCheck) return roleCheck;

  const code = process.env.ACCESS_CODE || '';
  return NextResponse.json(
    {
      enabled: Boolean(code),
      code,
    },
    {
      headers: { 'Cache-Control': 'private, no-store' },
    }
  );
};
