import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { getClassProgress, type ProgressFilters } from '@/lib/server/progress';
import { getDb } from '@/lib/db';

// GET /api/teacher/progress/class/[classId] - Get progress for all students in a class
export const GET = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  // Extract classId from URL path
  const pathParts = req.nextUrl.pathname.split('/').filter(Boolean);
  const classId = pathParts[pathParts.length - 1];

  // Verify class belongs to the teacher
  const db = getDb();
  const classRecord = db.prepare('SELECT id FROM classes WHERE id = ? AND teacher_id = ?').get(classId, ctx.user.id);
  if (!classRecord) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  // Parse query params
  const url = new URL(req.url);
  const filters: ProgressFilters = {};

  const assignmentId = url.searchParams.get('assignmentId');
  if (assignmentId) {
    filters.assignmentId = assignmentId;
  }

  const status = url.searchParams.get('status');
  if (status && ['all', 'completed', 'not_started', 'low_score'].includes(status)) {
    filters.status = status as ProgressFilters['status'];
  }

  const dateFrom = url.searchParams.get('dateFrom');
  if (dateFrom) {
    filters.dateFrom = dateFrom;
  }

  const dateTo = url.searchParams.get('dateTo');
  if (dateTo) {
    filters.dateTo = dateTo;
  }

  const progress = getClassProgress(classId, filters);

  if (!progress) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  return NextResponse.json({ progress });
});
