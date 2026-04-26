import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';

// GET /api/teacher/classes/[classId] - Get single class with student count
export const GET = withRole(['teacher'], async (req: NextRequest, ctx: any) => {
  const classId = req.nextUrl.pathname.split('/').pop();
  const db = getDb();

  const classData = db.prepare(`
    SELECT c.*,
           (SELECT COUNT(*) FROM class_memberships WHERE class_id = c.id) as student_count
    FROM classes c
    WHERE c.id = ? AND c.teacher_id = ?
  `).get(classId, ctx.user.id);

  if (!classData) {
    return NextResponse.json(
      { error: 'Class not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ class: classData });
});

// PATCH /api/teacher/classes/[classId] - Update class
export const PATCH = withRole(['teacher'], async (req: NextRequest, ctx: any) => {
  const classId = req.nextUrl.pathname.split('/').pop();
  const { name, subject, batch, peer_visibility_enabled } = await req.json();
  const db = getDb();

  // Verify ownership
  const existing = db.prepare('SELECT id FROM classes WHERE id = ? AND teacher_id = ?').get(classId, ctx.user.id);
  if (!existing) {
    return NextResponse.json(
      { error: 'Class not found' },
      { status: 404 }
    );
  }

  // Build update query dynamically
  const updates: string[] = [];
  const values: any[] = [];

  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name.trim());
  }
  if (subject !== undefined) {
    updates.push('subject = ?');
    values.push(subject.trim());
  }
  if (batch !== undefined) {
    updates.push('batch = ?');
    values.push(batch.trim());
  }
  if (peer_visibility_enabled !== undefined) {
    updates.push('peer_visibility_enabled = ?');
    values.push(peer_visibility_enabled ? 1 : 0);
  }

  if (updates.length === 0) {
    return NextResponse.json(
      { error: 'No fields to update' },
      { status: 400 }
    );
  }

  updates.push("updated_at = datetime('now')");
  values.push(classId);

  db.prepare(`UPDATE classes SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId);

  return NextResponse.json({ class: updated });
});

// DELETE /api/teacher/classes/[classId] - Soft delete class
export const DELETE = withRole(['teacher'], async (req: NextRequest, ctx: any) => {
  const classId = req.nextUrl.pathname.split('/').pop();
  const db = getDb();

  // Verify ownership
  const existing = db.prepare('SELECT id FROM classes WHERE id = ? AND teacher_id = ?').get(classId, ctx.user.id);
  if (!existing) {
    return NextResponse.json(
      { error: 'Class not found' },
      { status: 404 }
    );
  }

  // Soft delete by setting status
  db.prepare(`
    UPDATE classes
    SET status = 'inactive', updated_at = datetime('now')
    WHERE id = ?
  `).run(classId);

  return NextResponse.json({ success: true });
});
