import { NextResponse } from 'next/server';
import { withRole } from '../../../middleware';

// GET /api/teacher/access-code — return the OpenMAIC room access code to
// authenticated teachers. They need it to share with students who open
// the /classroom/:id link; previously they had no way to see the code
// from the teacher dashboard and had to ask support.
//
// The code is mirrored from core/.env's ACCESS_CODE in the app's own env.
// We never return it to unauthenticated callers.
export const GET = withRole(['teacher'], async () => {
  const code = process.env.ACCESS_CODE || '';
  return NextResponse.json({
    enabled: Boolean(code),
    // Empty string when disabled — frontend treats empty as "no gate".
    code,
  });
});
