import { NextResponse } from 'next/server';
import { lessons } from '@/app/lib/mock-data';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: lessons,
  });
}
