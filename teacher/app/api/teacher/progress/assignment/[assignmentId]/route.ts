import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { getAssignmentProgress } from '@/lib/server/progress';
import { getDb } from '@/lib/db';

// GET /api/teacher/progress/assignment/[assignmentId] - Get progress for a specific assignment
export const GET = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  // Extract assignmentId from URL path
  const pathParts = req.nextUrl.pathname.split('/').filter(Boolean);
  const assignmentId = pathParts[pathParts.length - 1];

  // Verify assignment belongs to the teacher
  const db = getDb();
  const assignment = db.prepare(`
    SELECT a.id FROM assignments a
    INNER JOIN classes c ON c.id = a.class_id
    WHERE a.id = ? AND c.teacher_id = ?
  `).get(assignmentId, ctx.user.id);

  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  const progress = getAssignmentProgress(assignmentId);

  if (!progress) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  return NextResponse.json({ progress });
});
