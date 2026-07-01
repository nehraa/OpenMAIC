import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { withTenant } from '@/lib/db';
import { z } from 'zod';

const TrackProgressSchema = z.object({
  slideId: z.string().min(1),
});

// POST /api/student/assignments/[assignmentId]/progress
// Track which slide the student has viewed
export const POST = async (
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

  const body = await request.json();
  const parsed = TrackProgressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'slideId is required' }, { status: 400 });
  }

  const { slideId } = parsed.data;
  const studentId = authResult.user.id;

  const result = await withTenant(authResult.tenantId, async (client) => {
    // First verify this assignment is assigned to this student
    const recipientResult = await client.query(
      `SELECT ar.id
       FROM assignment_recipients ar
       JOIN assignments a ON ar.assignment_id = a.id
       WHERE ar.assignment_id = $1
         AND ar.student_id = $2
         AND a.status IN ('released', 'closed')`,
      [assignmentId, studentId]
    );

    if (recipientResult.rows.length === 0) {
      return { notAssigned: true as const };
    }

    await client.query(
      `INSERT INTO assignment_slide_progress (tenant_id, assignment_id, student_id, slide_id, viewed_at)
       VALUES (
         (SELECT tenant_id FROM assignments WHERE id = $1),
         $1, $2, $3, NOW()
       )
       ON CONFLICT (assignment_id, student_id, slide_id)
       DO UPDATE SET viewed_at = NOW()`,
      [assignmentId, studentId, slideId]
    );

    const countResult = await client.query<{ viewed_count: number }>(
      `SELECT COUNT(*)::int AS viewed_count
       FROM assignment_slide_progress
       WHERE assignment_id = $1 AND student_id = $2`,
      [assignmentId, studentId]
    );

    const count = countResult.rows[0]?.viewed_count ?? 0;

    const assignmentResult = await client.query<{ slide_asset_version_id: string | null }>(
      `SELECT slide_asset_version_id FROM assignments WHERE id = $1`,
      [assignmentId]
    );
    const assignment = assignmentResult.rows[0];

    let totalSlides = 0;
    if (assignment?.slide_asset_version_id) {
      const versionResult = await client.query<{ payload_json: string | null }>(
        `SELECT payload_json FROM content_asset_versions WHERE id = $1`,
        [assignment.slide_asset_version_id]
      );
      const version = versionResult.rows[0];
      if (version?.payload_json) {
        try {
          const payload = JSON.parse(version.payload_json) as { slides?: unknown };
          totalSlides = Array.isArray(payload.slides) ? payload.slides.length : 0;
        } catch {
          totalSlides = 0;
        }
      }
    }

    return { count, totalSlides };
  });

  if ('notAssigned' in result && result.notAssigned) {
    return NextResponse.json({ error: 'Assignment not found or not assigned to you' }, { status: 404 });
  }

  const { count, totalSlides } = result;
  return NextResponse.json({
    success: true,
    progress: {
      viewed_count: count,
      total_slides: totalSlides,
      is_complete: totalSlides > 0 && count >= totalSlides,
    },
  });
};
