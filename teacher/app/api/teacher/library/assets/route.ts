import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getLibraryAssets, saveGeneratedContent, getAssetById } from '@/lib/server/library';
import type { AuthContext } from '@/middleware/auth';
import { z } from 'zod';

const SaveAssetSchema = z.object({
  type: z.enum(['slide_deck', 'quiz']),
  title: z.string().min(1, 'Title is required'),
  payload: z.record(z.string(), z.unknown()),
  subjectTag: z.string().optional(),
  sourceKind: z.enum(['manual', 'ai_generated', 'imported']).optional(),
  sourceRef: z.string().optional()
});

// GET /api/teacher/library/assets - List library assets
export const GET = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const url = new URL(req.url);

  const filters = {
    type: url.searchParams.get('type') as 'slide_deck' | 'quiz' | undefined,
    subject: url.searchParams.get('subject') || undefined,
    search: url.searchParams.get('search') || undefined,
    limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
    offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : undefined
  };

  const result = getLibraryAssets(ctx.user.id, filters);

  return NextResponse.json({
    assets: result.assets,
    total: result.total,
    limit: filters.limit || 50,
    offset: filters.offset || 0
  });
});

// POST /api/teacher/library/assets - Save generated content
export const POST = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const body = await req.json();

  const parsed = SaveAssetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;

  const asset = saveGeneratedContent({
    teacherId: ctx.user.id,
    type: data.type,
    title: data.title,
    payload: data.payload,
    subjectTag: data.subjectTag,
    sourceKind: data.sourceKind,
    sourceRef: data.sourceRef
  });

  return NextResponse.json({ asset }, { status: 201 });
});