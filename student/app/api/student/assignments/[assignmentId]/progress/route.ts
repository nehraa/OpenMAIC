import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { getDb } from '@/lib/db';
import { z } from 'zod';

const TrackProgressSchema = z.object({
  slideId: z.string().min(1)
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
  const db = getDb();

  // First verify this assignment is assigned to this student
  const recipientCheck = db.query(`
    SELECT ar.id
    FROM assignment_recipients ar
    JOIN assignments a ON ar.assignment_id = a.id
    WHERE ar.assignment_id = $1
      AND ar.student_id = $2
      AND a.status IN ('released', 'closed')
  `, [assignmentId, studentId]);

  const recipient = (recipientCheck as any)?.rows?.[0] || (recipientCheck as any);
  if (!recipient) {
    return NextResponse.json({ error: 'Assignment not found or not assigned to you' }, { status: 404 });
  }

  // Insert or update slide progress using UPSERT
  // ON CONFLICT DO UPDATE sets viewed_at to current time (re-viewing a slide updates timestamp)
  await db.query(`
    INSERT INTO assignment_slide_progress (assignment_id, student_id, slide_id, viewed_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (assignment_id, student_id, slide_id)
    DO UPDATE SET viewed_at = NOW()
  `, [assignmentId, studentId, slideId]);

  // Get updated progress count
  const countResult = db.query(`
    SELECT COUNT(*) as viewed_count
    FROM assignment_slide_progress
    WHERE assignment_id = $1 AND student_id = $2
  `, [assignmentId, studentId]);

  const count = ((countResult as any)?.rows?.[0]?.viewed_count || (countResult as any)?.viewed_count || 0) as number;

  // Get total slides count from the assignment's slide asset version
  const assignmentResult = db.query(`
    SELECT slide_asset_version_id
    FROM assignments
    WHERE id = $1
  `, [assignmentId]);

  const assignment = (assignmentResult as any)?.rows?.[0] || (assignmentResult as any);

  let totalSlides = 0;
  if (assignment?.slide_asset_version_id) {
    const versionResult = db.query(`
      SELECT payload_json
      FROM content_asset_versions
      WHERE id = $1
    `, [assignment.slide_asset_version_id]);

    const version = (versionResult as any)?.rows?.[0] || (versionResult as any);
    if (version?.payload_json) {
      try {
        const payload = JSON.parse(version.payload_json);
        totalSlides = (payload.slides || []).length;
      } catch {
        totalSlides = 0;
      }
    }
  }

  return NextResponse.json({
    success: true,
    progress: {
      viewed_count: count,
      total_slides: totalSlides,
      is_complete: totalSlides > 0 && count >= totalSlides
    }
  });
}