import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/middleware/auth';
import { z } from 'zod';

const CreateLiveSessionSchema = z.object({
  assignmentId: z.string().min(1)
});

interface RouteContext {
  params: Promise<Record<string, string>>;
}

// GET /api/teacher/live-sessions - List live sessions for teacher
export const GET = withRole(['teacher'], async (_req: NextRequest, ctx: AuthContext, _routeCtx: RouteContext) => {
  const db = getDb();

  const result = await db.query(`
    SELECT ls.*, a.title as assignment_title
    FROM live_sessions ls
    JOIN assignments a ON ls.assignment_id = a.id
    WHERE a.teacher_id = $1
    ORDER BY ls.started_at DESC
  `, [ctx.user.id]);

  return NextResponse.json({ sessions: result.rows });
});

// POST /api/teacher/live-sessions - Create a new live session from assignment
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, _routeCtx: RouteContext) => {
  const body = await req.json();

  const parsed = CreateLiveSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { assignmentId } = parsed.data;
  const db = getDb();

  // Verify assignment belongs to teacher
  const assignmentResult = await db.query(
    'SELECT id FROM assignments WHERE id = $1 AND teacher_id = $2',
    [assignmentId, ctx.user.id]
  );
  if (assignmentResult.rows.length === 0) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  // Check for existing live session for this assignment
  const activeSessionResult = await db.query(
    "SELECT id FROM live_sessions WHERE assignment_id = $1 AND status = 'live'",
    [assignmentId]
  );
  if (activeSessionResult.rows.length > 0) {
    return NextResponse.json({ error: 'An active live session already exists for this assignment' }, { status: 409 });
  }

  // Create new live session
  const initialState = {
    currentSlideIndex: 0,
    totalSlides: 0,
    timestamp: new Date().toISOString()
  };

  const sessionResult = await db.query(`
    INSERT INTO live_sessions (assignment_id, teacher_id, state_snapshot_json, status)
    VALUES ($1, $2, $3, 'live')
    RETURNING *
  `, [assignmentId, ctx.user.id, JSON.stringify(initialState)]);

  return NextResponse.json({ session: sessionResult.rows[0] }, { status: 201 });
});
