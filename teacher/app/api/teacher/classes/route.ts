import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/middleware/auth';

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

  const result = await db.query(`
    SELECT c.*,
           (SELECT COUNT(*) FROM class_memberships WHERE class_id = c.id) as student_count
    FROM classes c
    WHERE c.teacher_id = $1
    ORDER BY c.created_at DESC
  `, [ctx.user.id]);

  return NextResponse.json({ classes: result.rows });
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
    INSERT INTO classes (teacher_id, name, subject, batch, join_code)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [ctx.user.id, name.trim(), subject?.trim() || '', batch?.trim() || '', joinCode]);

  const newClass = result.rows[0];

  return NextResponse.json({ class: newClass }, { status: 201 });
});
