import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { withTenant } from '@/lib/db';

interface AssignmentRow {
  id: string;
  title: string;
  description: string | null;
  due_at: string | null;
  status: string;
  class_name: string;
  slide_asset_version_id: string | null;
  quiz_asset_version_id: string | null;
}

interface VersionRow {
  payload_json: string | null;
}

interface ProgressRow {
  slide_id: string;
  viewed_at: string;
}

interface AttemptRow {
  completion_state: string;
  submitted_at: string | null;
  score_percent: number | null;
}

// GET /api/student/assignments/[assignmentId]
// Get a single assignment for the authenticated student
export const GET = async (
  request: NextRequest,
  context: { params: Promise<{ assignmentId: string }> }
) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = requireRole(authResult.user, ['student_classroom', 'student_b2c']);
  if (roleCheck) return roleCheck;

  const { assignmentId } = await context.params;

  if (!assignmentId) {
    return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
  }

  const studentId = authResult.user.id;

  const result = await withTenant(authResult.tenantId, async (client) => {
    const assignmentResult = await client.query<AssignmentRow>(
      `SELECT a.id,
              a.title,
              a.description,
              a.due_at,
              a.status,
              c.name as class_name,
              a.slide_asset_version_id,
              a.quiz_asset_version_id
       FROM assignments a
       JOIN classes c ON a.class_id = c.id
       JOIN assignment_recipients ar ON a.id = ar.assignment_id
       WHERE a.id = $1
         AND ar.student_id = $2
         AND a.status IN ('released', 'closed')`,
      [assignmentId, studentId]
    );
    const assignmentRow = assignmentResult.rows[0];
    if (!assignmentRow) {
      return { notFound: true as const };
    }

    let slides: Array<{ slide_id: string; title: string; content: string }> = [];
    let openmaicUrl: string | null = null;

    if (assignmentRow.slide_asset_version_id) {
      const versionResult = await client.query<VersionRow>(
        `SELECT payload_json FROM content_asset_versions WHERE id = $1`,
        [assignmentRow.slide_asset_version_id]
      );
      const version = versionResult.rows[0];
      if (version?.payload_json) {
        try {
          const payload = JSON.parse(version.payload_json) as {
            openmaicClassroomId?: string;
            slides?: unknown;
          };
          if (payload.openmaicClassroomId) {
            const baseUrl =
              process.env.OPENMAIC_PUBLIC_URL ||
              process.env.OPENMAIC_BASE_URL;
            openmaicUrl = `${baseUrl}/classroom/${payload.openmaicClassroomId}`;
          } else {
            slides = Array.isArray(payload.slides) ? (payload.slides as typeof slides) : [];
          }
        } catch {
          slides = [];
        }
      }
    }

    const progressResult = await client.query<ProgressRow>(
      `SELECT slide_id, viewed_at
       FROM assignment_slide_progress
       WHERE assignment_id = $1 AND student_id = $2`,
      [assignmentId, studentId]
    );
    const viewedSlides = progressResult.rows;
    const viewedSlideIds = new Set(viewedSlides.map((p) => p.slide_id));

    const attemptResult = await client.query<AttemptRow>(
      `SELECT completion_state, submitted_at, score_percent
       FROM assignment_attempts
       WHERE assignment_id = $1 AND student_id = $2`,
      [assignmentId, studentId]
    );
    const attempt = attemptResult.rows[0] ?? null;

    return { assignmentRow, slides, openmaicUrl, viewedSlides, viewedSlideIds, attempt };
  });

  if ('notFound' in result && result.notFound) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  const { assignmentRow, slides, openmaicUrl, viewedSlides, viewedSlideIds, attempt } = result;

  const slidesWithStatus = slides.map((slide, index) => ({
    slide_id: slide.slide_id,
    title: slide.title,
    content: slide.content,
    index,
    viewed: viewedSlideIds.has(slide.slide_id),
    viewed_at: viewedSlides.find((p) => p.slide_id === slide.slide_id)?.viewed_at ?? null,
  }));

  return NextResponse.json({
    assignment: {
      id: assignmentRow.id,
      title: assignmentRow.title,
      description: assignmentRow.description,
      class_name: assignmentRow.class_name,
      due_at: assignmentRow.due_at,
      status: assignmentRow.status,
      slide_asset_version_id: assignmentRow.slide_asset_version_id,
      openmaicUrl,
    },
    slides: slidesWithStatus,
    progress: {
      viewed_count: viewedSlides.length,
      total_slides: slides.length,
      is_complete: slides.length > 0 && viewedSlides.length >= slides.length,
    },
    attempt,
  });
};
