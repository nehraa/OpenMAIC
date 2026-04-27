import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { exportToCSV, type ProgressFilters } from '@/lib/server/progress';
import { getDb } from '@/lib/db';

// GET /api/teacher/progress/export.csv - Export class progress as CSV
export const GET = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const url = new URL(req.url);

  const classId = url.searchParams.get('classId');
  if (!classId) {
    return NextResponse.json({ error: 'classId is required' }, { status: 400 });
  }

  // Verify class belongs to the teacher
  const db = getDb();
  const classRecord = db.prepare('SELECT id, name FROM classes WHERE id = ? AND teacher_id = ?').get(classId, ctx.user.id);
  if (!classRecord) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  // Parse filters
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

  const csv = exportToCSV(classId, filters);

  if (!csv) {
    return NextResponse.json({ error: 'Failed to generate CSV' }, { status: 500 });
  }

  const classInfo = classRecord as { id: string; name: string };
  const filename = `progress-${classInfo.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
});
