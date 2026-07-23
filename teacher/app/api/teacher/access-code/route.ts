import { NextResponse } from 'next/server';
import { withRole } from '@/lib/server/middleware';

export const GET = withRole(['teacher'], async () => {
  const code = process.env.ACCESS_CODE || '';

  return NextResponse.json(
    { enabled: Boolean(code), code },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
});
