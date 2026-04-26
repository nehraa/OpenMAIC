import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/middleware/auth';

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
export const GET = withRole(['teacher'], async (_req: NextRequest, ctx: AuthContext) => {
  const db = getDb();

  const classes = db.prepare(`
    SELECT c.*,
           (SELECT COUNT(*) FROM class_memberships WHERE class_id = c.id) as student_count
    FROM classes c
    WHERE c.teacher_id = ?
    ORDER BY c.created_at DESC
  `).all(ctx.user.id);

  return NextResponse.json({ classes });
});

// POST /api/teacher/classes - Create a new class
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const { name, subject, batch } = await req.json();

  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: 'Class name is required' }, { status: 400 });
  }

  const join_code = generateJoinCode();

  const db = getDb();

  const result = db.prepare(`
    INSERT INTO classes (teacher_id, name, subject, batch, join_code)
    VALUES (?, ?, ?, ?, ?)
  `).run(ctx.user.id, name.trim(), subject?.trim() || '', batch?.trim() || '', join_code);

  const newClass = db.prepare('SELECT * FROM classes WHERE id = ?').get(result.lastInsertRowid);

  return NextResponse.json({ class: newClass }, { status: 201 });
});
