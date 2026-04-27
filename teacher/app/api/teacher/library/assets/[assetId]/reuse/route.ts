import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { reuseAsset } from '@/lib/server/library';
import type { AuthContext } from '@/middleware/auth';
import { getDb } from '@/lib/db';
import { z } from 'zod';

const ReuseAssetSchema = z.object({
  classId: z.string().min(1, 'Class is required'),
  title: z.string().optional(),
  releaseAt: z.string().optional(),
  dueAt: z.string().optional()
});

// POST /api/teacher/library/assets/[assetId]/reuse - Create assignment from asset
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  // Extract assetId from URL path: /api/teacher/library/assets/{assetId}/reuse
  const pathParts = req.nextUrl.pathname.split('/').filter(Boolean);
  const assetId = pathParts[pathParts.length - 2]; // Second to last is the assetId

  const body = await req.json();

  const parsed = ReuseAssetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;

  // Verify class belongs to teacher
  const db = getDb();
  const classRecord = db.prepare('SELECT id FROM classes WHERE id = ? AND teacher_id = ?').get(data.classId, ctx.user.id);
  if (!classRecord) {
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