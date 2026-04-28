import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/middleware/auth';
import { reuseAsset } from '@/lib/server/library';
import { z } from 'zod';

const ReuseAssetSchema = z.object({
  classId: z.string().min(1, 'Class is required'),
  title: z.string().optional(),
  releaseAt: z.string().optional(),
  dueAt: z.string().optional()
});

// POST /api/teacher/library/assets/[assetId]/reuse - Create assignment from asset
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { assetId } = await routeCtx.params;

  const body = await req.json();

  const parsed = ReuseAssetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;

  // Verify class belongs to teacher
  const db = getDb();
  const classResult = await db.query('SELECT id FROM classes WHERE id = $1 AND teacher_id = $2', [data.classId, ctx.user.id]);
  if (classResult.rows.length === 0) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  try {
    const assignment = reuseAsset(ctx.user.id, {
      assetId,
      targetClassId: data.classId,
      title: data.title,
      releaseAt: data.releaseAt,
      dueAt: data.dueAt
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create assignment';
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
