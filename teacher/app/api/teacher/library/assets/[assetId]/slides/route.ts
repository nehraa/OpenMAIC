import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/server/middleware';
import { getAssetWithVersions } from '@/lib/server/library';
import type { AuthContext } from '@/lib/server/middleware/auth';

// GET /api/teacher/library/assets/[assetId]/slides
// Returns a simplified { slide_id, title, content }[] for the asset. If the
// asset version payload already carries `slides`, those are returned as-is.
// Otherwise we fetch the OpenMAIC classroom from Core and extract text from
// the PPTist canvas elements (text/shape/table/code). Non-slide scenes get
// a placeholder marker so teachers still see all scenes in the preview.
export const GET = withRole(
  ['teacher'],
  async (_req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
    const { assetId } = await routeCtx.params;

    const asset = await getAssetWithVersions(assetId);
    if (!asset || asset.owner_teacher_id !== ctx.user.id) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const rawPayload = asset.currentVersion?.payload_json;
    const payload = typeof rawPayload === 'string' ? safeParse(rawPayload) : rawPayload;

    if (Array.isArray(payload?.slides) && payload.slides.length > 0) {
      return NextResponse.json({ slides: payload.slides, source: 'cached' });
    }

    const classroomId = payload?.openmaicClassroomId as string | undefined;
    if (!classroomId) {
      return NextResponse.json({ error: 'No classroom linked to this asset' }, { status: 404 });
    }

    const coreUrl = process.env.CORE_INTERNAL_URL || process.env.OPENMAIC_PUBLIC_URL;
    if (!coreUrl) {
      return NextResponse.json({ error: 'Core service is not configured' }, { status: 503 });
    }

    const res = await fetch(`${coreUrl.replace(/\/+$/, '')}/api/classroom?id=${encodeURIComponent(classroomId)}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Classroom fetch failed: HTTP ${res.status}` }, { status: 502 });
    }

    const json = (await res.json()) as { classroom?: { scenes?: unknown[] } };
    const scenes = json.classroom?.scenes ?? [];
    const slides = scenes.map(extractSlide);

    return NextResponse.json({ slides, source: 'core' });
  }
);

function safeParse(s: string): Record<string, unknown> | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

interface ExtractedSlide {
  slide_id: string;
  title: string;
  content: string;
}

function extractSlide(scene: unknown): ExtractedSlide {
  const s = scene as {
    id?: string;
    title?: string;
    type?: string;
    content?: { type?: string; canvas?: { elements?: unknown[] } };
  };

  const slide_id = s.id ?? '';
  const title = s.title ?? '';

  if (s.type === 'slide' && s.content?.type === 'slide' && Array.isArray(s.content.canvas?.elements)) {
    const parts: string[] = [];
    for (const el of s.content.canvas.elements) {
      collectText(el, parts);
    }
    return { slide_id, title, content: parts.join('\n\n') };
  }

  return { slide_id, title, content: `[${s.type ?? 'scene'}]` };
}

function collectText(el: unknown, out: string[]): void {
  if (!el || typeof el !== 'object') return;
  const e = el as { type?: string; content?: string; text?: { content?: string }; data?: unknown; lines?: { content?: string }[] };

  if (e.type === 'text' && typeof e.content === 'string') {
    out.push(stripHtml(e.content));
  } else if (e.type === 'shape' && e.text?.content) {
    out.push(stripHtml(e.text.content));
  } else if (e.type === 'table' && Array.isArray(e.data)) {
    for (const row of e.data) {
      if (!Array.isArray(row)) continue;
      for (const cell of row) {
        const text = (cell as { text?: string })?.text;
        if (text) out.push(text);
      }
    }
  } else if (e.type === 'code' && Array.isArray(e.lines)) {
    out.push(e.lines.map((l) => l.content ?? '').join('\n'));
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}