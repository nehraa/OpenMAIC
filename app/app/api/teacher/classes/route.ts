import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '../../../middleware';
import { getDb } from '../../../lib/db';
import type { AuthContext } from '../../../middleware/auth';

interface RouteContext {
  params: Promise<Record<string, string>>;
}

// Generate unique join code
function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET /api/teacher/classes - List all classes for teacher
export const GET = withRole(['teacher'], async (_req: NextRequest, ctx: AuthContext, _routeCtx: RouteContext) => {
  const db = getDb();

  const url = new URL(_req.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '20', 10) || 20, 1), 100);
  const cursor = url.searchParams.get('cursor');
  const cursorCreatedAt = cursor ? new Date(cursor) : null;

  let query: string;
  let countResult: { rows: { total: string }[] };
  const values: (string | Date | null)[] = [ctx.user.id];

  if (cursorCreatedAt) {
    query = `
      SELECT c.*,
             (SELECT COUNT(*) FROM class_memberships WHERE class_id = c.id) as student_count
      FROM classes c
      WHERE c.teacher_id = $1 AND c.created_at < $2
      ORDER BY c.created_at DESC, c.id DESC
      LIMIT ${limit + 1}
    `;
    values.push(cursorCreatedAt);
    countResult = await db.query(`
      SELECT COUNT(*) as total FROM classes WHERE teacher_id = $1
    `, [ctx.user.id]);
  } else {
    query = `
      SELECT c.*,
             (SELECT COUNT(*) FROM class_memberships WHERE class_id = c.id) as student_count
      FROM classes c
      WHERE c.teacher_id = $1
      ORDER BY c.created_at DESC, c.id DESC
      LIMIT ${limit + 1}
    `;
    countResult = await db.query(`
      SELECT COUNT(*) as total FROM classes WHERE teacher_id = $1
    `, [ctx.user.id]);
  }

  const result = await db.query(query, values);

  const total = parseInt(countResult.rows[0].total, 10);
  const hasMore = result.rows.length > limit;
  if (hasMore) {
    result.rows.pop();
  }
  const nextCursor = hasMore && result.rows.length > 0
    ? result.rows[result.rows.length - 1].created_at.toISOString()
    : null;

  return NextResponse.json({
    classes: result.rows,
    total,
    hasMore,
    nextCursor
  });
});

// POST /api/teacher/classes - Create a new class
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, _routeCtx: RouteContext) => {
  const { name, subject, batch } = await req.json();

  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: 'Class name is required' }, { status: 400 });
  }

  const joinCode = generateJoinCode();

  const db = getDb();

  const result = await db.query(`
    INSERT INTO classes (teacher_id, tenant_id, name, subject, batch, join_code)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [ctx.user.id, ctx.tenantId, name.trim(), subject?.trim() || '', batch?.trim() || '', joinCode]);

  const newClass = result.rows[0];

  return NextResponse.json({ class: newClass }, { status: 201 });
});
