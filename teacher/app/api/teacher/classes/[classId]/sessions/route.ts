import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/middleware/auth';

// POST /api/teacher/classes/[classId]/sessions - Create a new session in 'draft' status
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { classId } = await routeCtx.params;
  const db = getDb();

  // Verify teacher owns the class
  const classResult = await db.query('SELECT id FROM classes WHERE id = $1 AND teacher_id = $2', [classId, ctx.user.id]);
  if (classResult.rows.length === 0) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  const { title, max_duration_minutes } = await req.json();

  const sessionTitle = title?.trim() || '';
  const maxDuration = max_duration_minutes || 15;

  if (typeof maxDuration !== 'number' || maxDuration < 1 || maxDuration > 180) {
    return NextResponse.json({ error: 'max_duration_minutes must be between 1 and 180' }, { status: 400 });
  }

  const sessionResult = await db.query(`
    INSERT INTO classroom_sessions (class_id, teacher_id, title, max_duration_minutes, status)
    VALUES ($1, $2, $3, $4, 'draft')
    RETURNING *
  `, [classId, ctx.user.id, sessionTitle, maxDuration]);

  return NextResponse.json({ session: sessionResult.rows[0] }, { status: 201 });
});
