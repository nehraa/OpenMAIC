import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getAssetWithVersions, tagAsset, updateAssetTitle } from '@/lib/server/library';
import type { AuthContext } from '@/middleware/auth';
import { z } from 'zod';

const UpdateAssetSchema = z.object({
  title: z.string().min(1).optional(),
  subjectTag: z.string().optional()
});

// GET /api/teacher/library/assets/[assetId] - Get asset with versions
export const GET = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { assetId } = await routeCtx.params;

  const assetWithVersions = await getAssetWithVersions(assetId);

  if (!assetWithVersions) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  if (assetWithVersions.owner_teacher_id !== ctx.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  return NextResponse.json({ asset: assetWithVersions });
});

// PATCH /api/teacher/library/assets/[assetId] - Update asset title or subject tag
export const PATCH = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { assetId } = await routeCtx.params;
  const body = await req.json();

  const parsed = UpdateAssetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  let asset;
  if (parsed.data.subjectTag !== undefined) {
    asset = await tagAsset(ctx.user.id, { assetId, subjectTag: parsed.data.subjectTag });
  } else if (parsed.data.title !== undefined) {
    asset = await updateAssetTitle(ctx.user.id, assetId, parsed.data.title);
  }

  if (!asset) {
    return NextResponse.json({ error: 'Asset not found or access denied' }, { status: 404 });
  }

  return NextResponse.json({ asset });
});
