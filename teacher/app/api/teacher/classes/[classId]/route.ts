import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/middleware/auth';

// GET /api/teacher/classes/[classId] - Get single class with student count
export const GET = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { classId } = await routeCtx.params;
  const db = getDb();

  const result = await db.query(`
    SELECT c.*,
           (SELECT COUNT(*) FROM class_memberships WHERE class_id = c.id) as student_count
    FROM classes c
    WHERE c.id = $1 AND c.teacher_id = $2
  `, [classId, ctx.user.id]);

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  return NextResponse.json({ class: result.rows[0] });
});

// PATCH /api/teacher/classes/[classId] - Update class
export const PATCH = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { classId } = await routeCtx.params;
  const { name, subject, batch, peer_visibility_enabled } = await req.json();
  const db = getDb();

  // Check class exists and belongs to teacher
  const existingResult = await db.query(
    'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
    [classId, ctx.user.id]
  );
  if (existingResult.rows.length === 0) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  const updates: string[] = [];
  const values: (string | number | boolean)[] = [];
  let paramIndex = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(name.trim());
  }
  if (subject !== undefined) {
    updates.push(`subject = $${paramIndex++}`);
    values.push(subject.trim());
  }
  if (batch !== undefined) {
    updates.push(`batch = $${paramIndex++}`);
    values.push(batch.trim());
  }
  if (peer_visibility_enabled !== undefined) {
    updates.push(`peer_visibility_enabled = $${paramIndex++}`);
    values.push(peer_visibility_enabled ? 1 : 0);
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  updates.push(`updated_at = NOW()`);
  values.push(classId);

  const updateQuery = `UPDATE classes SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  const updatedResult = await db.query(updateQuery, values);

  return NextResponse.json({ class: updatedResult.rows[0] });
});

// DELETE /api/teacher/classes/[classId] - Soft delete class
export const DELETE = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { classId } = await routeCtx.params;
  const db = getDb();

  const existingResult = await db.query(
    'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
    [classId, ctx.user.id]
  );
  if (existingResult.rows.length === 0) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  await db.query(`UPDATE classes SET updated_at = NOW() WHERE id = $1`, [classId]);

  return NextResponse.json({ success: true });
});
