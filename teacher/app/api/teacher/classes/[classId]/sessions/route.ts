import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/middleware/auth';

// POST /api/teacher/classes/[classId]/sessions - Create a new session in 'draft' status
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const pathParts = req.nextUrl.pathname.split('/').filter(Boolean);
  const classId = pathParts[pathParts.length - 2];
  const db = getDb();

  // Verify teacher owns the class
  const classData = db.prepare('SELECT id FROM classes WHERE id = ? AND teacher_id = ?').get(classId, ctx.user.id);
  if (!classData) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  const { title, max_duration_minutes } = await req.json();

  const sessionTitle = title?.trim() || '';
  const maxDuration = max_duration_minutes || 15;

  if (typeof maxDuration !== 'number' || maxDuration < 1 || maxDuration > 180) {
    return NextResponse.json({ error: 'max_duration_minutes must be between 1 and 180' }, { status: 400 });
  }

  const result = db.prepare(`
    INSERT INTO classroom_sessions (class_id, teacher_id, title, max_duration_minutes, status)
    VALUES (?, ?, ?, ?, 'draft')
  `).run(classId, ctx.user.id, sessionTitle, maxDuration);

  const session = db.prepare('SELECT * FROM classroom_sessions WHERE id = ?').get(result.lastInsertRowid);

  return NextResponse.json({ session }, { status: 201 });
});
