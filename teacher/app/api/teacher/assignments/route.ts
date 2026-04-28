import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/middleware/auth';
import { z } from 'zod';

const CreateAssignmentSchema = z.object({
  classId: z.string().min(1),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  slideAssetVersionId: z.string().optional(),
  quizAssetVersionId: z.string().optional(),
  releaseAt: z.string().optional(),
  dueAt: z.string().optional()
});

interface RouteContext {
  params: Promise<Record<string, string>>;
}

// GET /api/teacher/assignments - List assignments for teacher
export const GET = withRole(['teacher'], async (_req: NextRequest, ctx: AuthContext, _routeCtx: RouteContext) => {
  const db = getDb();

  // Get filter params from URL
  const url = new URL(_req.url);
  const classId = url.searchParams.get('classId') || undefined;
  const status = url.searchParams.get('status') as 'draft' | 'scheduled' | 'released' | 'closed' | undefined;

  const conditions: string[] = ['a.teacher_id = $1'];
  const values: (string | undefined)[] = [ctx.user.id];
  let paramIndex = 2;

  if (classId) {
    conditions.push(`a.class_id = $${paramIndex++}`);
    values.push(classId);
  }
  if (status) {
    conditions.push(`a.status = $${paramIndex++}`);
    values.push(status);
  }

  const query = `
    SELECT a.*, c.name as class_name,
           (SELECT COUNT(*) FROM assignment_recipients WHERE assignment_id = a.id) as recipient_count
    FROM assignments a
    JOIN classes c ON a.class_id = c.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY a.created_at DESC
  `;

  const result = await db.query(query, values);

  return NextResponse.json({ assignments: result.rows });
});

// POST /api/teacher/assignments - Create a new assignment
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, _routeCtx: RouteContext) => {
  const body = await req.json();

  const parsed = CreateAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;

  const db = getDb();

  // Verify class belongs to teacher
  const classResult = await db.query(
    'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
    [data.classId, ctx.user.id]
  );
  if (classResult.rows.length === 0) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  // Create assignment
  const insertResult = await db.query(`
    INSERT INTO assignments (class_id, teacher_id, title, description, slide_asset_version_id, quiz_asset_version_id, release_at, due_at, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft')
    RETURNING *
  `, [
    data.classId,
    ctx.user.id,
    data.title,
    data.description || '',
    data.slideAssetVersionId || null,
    data.quizAssetVersionId || null,
    data.releaseAt || null,
    data.dueAt || null
  ]);

  const assignment = insertResult.rows[0];

  // Get class name for response
  const classResult2 = await db.query('SELECT name FROM classes WHERE id = $1', [data.classId]);

  return NextResponse.json({
    assignment: {
      ...assignment,
      class_name: classResult2.rows[0]?.name
    }
  }, { status: 201 });
});
