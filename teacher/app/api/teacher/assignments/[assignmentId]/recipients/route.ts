import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { getAssignmentById } from '@/lib/server/assignments';
import { getDb } from '@/lib/db';

// GET /api/teacher/assignments/[assignmentId]/recipients - Get recipients with progress
export const GET = withRole(['teacher'], async (_req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { assignmentId } = await routeCtx.params;

  const assignment = await getAssignmentById(assignmentId);
  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  if (assignment.teacher_id !== ctx.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const db = getDb();

  // Get all recipients with their student names and progress
  // If assignment has slide_asset_version_id, get total slides from content_asset_versions
  // Otherwise total_slides stays 0
  const totalSlidesQuery = assignment.slide_asset_version_id
    ? `SELECT (payload_json::json->>'slides')::json->>'length' as slide_count FROM content_asset_versions WHERE id = $1`
    : `SELECT 0 as slide_count`;

  let totalSlides = 0;
  if (assignment.slide_asset_version_id) {
    const countResult = await db.query(`SELECT payload_json FROM content_asset_versions WHERE id = $1`, [assignment.slide_asset_version_id]);
    const version = countResult?.rows?.[0];
    if (version?.payload_json) {
      try {
        const payload = JSON.parse(version.payload_json);
        totalSlides = (payload.slides || []).length;
      } catch {
        totalSlides = 0;
      }
    }
  }

  // Get recipients with student names and their slide progress
  const result = await db.query(`
    SELECT
      ar.id,
      ar.student_id,
      u.name as student_name,
      ar.visibility_status,
      ar.assigned_at,
      COALESCE(
        (SELECT COUNT(*) FROM assignment_slide_progress asp
         WHERE asp.assignment_id = ar.assignment_id AND asp.student_id = ar.student_id),
        0
      ) as viewed_count
    FROM assignment_recipients ar
    JOIN users u ON ar.student_id = u.id
    WHERE ar.assignment_id = $1
    ORDER BY u.name ASC
  `, [assignmentId]);

  const recipients = result.rows.map((row: any) => ({
    student_id: row.student_id,
    student_name: row.student_name,
    visibility_status: row.visibility_status,
    assigned_at: row.assigned_at,
    progress: {
      viewed_count: parseInt(row.viewed_count, 10),
      total_slides: totalSlides,
      is_complete: totalSlides > 0 && parseInt(row.viewed_count, 10) >= totalSlides
    }
  }));

  return NextResponse.json({ recipients });
});