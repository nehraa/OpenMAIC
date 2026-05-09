import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import type { AuthContext } from '@/middleware/auth';
import { getDb } from '@/lib/db';
import type { User } from '@shared/types/roles';

interface RouteContext {
  params: Promise<Record<string, string>>;
}

interface StudentWithProgress {
  studentId: string;
  studentName: string;
  studentPhone: string;
  classId: string;
  className: string;
  completionRate: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  avgQuizScore: number;
  quizAttempts: number;
  totalTimeMinutes: number;
  lastActive: string | null;
}

interface ProgressFilters {
  classId?: string;
  dateRange?: 'week' | 'month' | 'all';
}

function getStartDate(dateRange: 'week' | 'month' | 'all'): Date | null {
  const now = new Date();
  switch (dateRange) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'all':
    default:
      return null;
  }
}

interface ClassInfo {
  id: string;
  name: string;
  subject: string;
  batch: string;
  student_count: number;
}

async function getTeacherClasses(teacherId: string): Promise<ClassInfo[]> {
  const db = getDb();
  const result = await db.query(`
    SELECT c.id, c.name, c.subject, c.batch,
           (SELECT COUNT(*) FROM class_memberships WHERE class_id = c.id) as student_count
    FROM classes c
    WHERE c.teacher_id = $1
    ORDER BY c.created_at DESC
  `, [teacherId]);
  return result.rows as ClassInfo[];
}

async function getTeacherProgressData(
  teacherId: string,
  filters: ProgressFilters
): Promise<{
  students: StudentWithProgress[];
  stats: {
    totalStudents: number;
    avgCompletion: number;
    avgQuizScore: number;
    avgTimeMinutes: number;
    studentTrend: number;
    completionTrend: number;
    scoreTrend: number;
  };
  classes: ClassInfo[];
  completionTimeline: Array<{ date: string; completion: number }>;
  quizDistribution: Array<{ range: string; count: number }>;
}> {
  const db = getDb();
  const startDate = getStartDate(filters.dateRange || 'month');

  // Get all students across teacher's classes with their progress
  let studentQuery = `
    SELECT DISTINCT u.id as student_id,
           u.name as student_name,
           u.phone_e164 as student_phone,
           c.id as class_id,
           c.name as class_name
    FROM users u
    INNER JOIN class_memberships cm ON cm.student_id = u.id
    INNER JOIN classes c ON c.id = cm.class_id
    WHERE c.teacher_id = $1
  `;
  const studentParams: any[] = [teacherId];

  if (filters.classId) {
    studentQuery += ' AND c.id = $2';
    studentParams.push(filters.classId);
  }

  const studentsResult = await db.query(studentQuery, studentParams);
  const studentRecords = studentsResult.rows as Array<{
    student_id: string;
    student_name: string;
    student_phone: string;
    class_id: string;
    class_name: string;
  }>;

  // Build student progress data
  const students: StudentWithProgress[] = [];

  for (const student of studentRecords) {
    // Get assignments for this student's class
    const assignmentsResult = await db.query(`
      SELECT a.id, a.title, a.slide_asset_version_id
      FROM assignments a
      WHERE a.class_id = $1 AND a.status = 'released'
    `, [student.class_id]);

    const assignments = assignmentsResult.rows as Array<{
      id: string;
      title: string;
      slide_asset_version_id: string | null;
    }>;

    let totalAssignments = assignments.length;
    let assignmentsCompleted = 0;
    let totalQuizScore = 0;
    let quizAttempts = 0;
    let totalSlidesViewed = 0;
    let totalSlides = 0;
    let totalTimeMinutes = 0;
    let lastActive: string | null = null;

    for (const assignment of assignments) {
      // Get slide progress
      const slideProgressResult = await db.query(`
        SELECT COUNT(DISTINCT slide_id) as slides_viewed
        FROM assignment_slide_progress
        WHERE assignment_id = $1 AND student_id = $2
      `, [assignment.id, student.student_id]);

      const slidesViewed = (slideProgressResult.rows[0] as any)?.slides_viewed || 0;
      totalSlidesViewed += slidesViewed;

      // Get total slides for this assignment
      let slideCount = 0;
      if (assignment.slide_asset_version_id) {
        const versionResult = await db.query(`
          SELECT payload_json FROM content_asset_versions WHERE id = $1
        `, [assignment.slide_asset_version_id]);
        const versionRow = versionResult.rows[0] as { payload_json: string } | undefined;
        if (versionRow) {
          try {
            const payload = JSON.parse(versionRow.payload_json);
            slideCount = Array.isArray(payload.slides) ? payload.slides.length : 0;
          } catch {
            slideCount = 0;
          }
        }
      }
      totalSlides += slideCount;

      // Mark completed if all slides viewed
      if (slideCount > 0 && slidesViewed >= slideCount) {
        assignmentsCompleted++;
      }

      // Get quiz attempt
      const attemptResult = await db.query(`
        SELECT score_percent, started_at, submitted_at
        FROM assignment_attempts
        WHERE assignment_id = $1 AND student_id = $2
      `, [assignment.id, student.student_id]);

      const attempt = attemptResult.rows[0] as {
        score_percent: number | null;
        started_at: string | null;
        submitted_at: string | null;
      } | undefined;

      if (attempt) {
        if (attempt.score_percent !== null) {
          totalQuizScore += attempt.score_percent;
          quizAttempts++;
        }
        if (attempt.started_at) {
          if (!lastActive || attempt.started_at > lastActive) {
            lastActive = attempt.started_at;
          }
        }
        if (attempt.started_at && attempt.submitted_at) {
          const startTime = new Date(attempt.started_at).getTime();
          const endTime = new Date(attempt.submitted_at).getTime();
          totalTimeMinutes += Math.round((endTime - startTime) / 60000);
        }
      }

      // Get last slide view
      const lastViewResult = await db.query(`
        SELECT MAX(viewed_at) as last_view
        FROM assignment_slide_progress
        WHERE assignment_id = $1 AND student_id = $2
      `, [assignment.id, student.student_id]);

      const lastView = (lastViewResult.rows[0] as any)?.last_view;
      if (lastView && (!lastActive || lastView > lastActive)) {
        lastActive = lastView;
      }
    }

    // Filter by date if needed
    if (startDate && lastActive) {
      const lastActiveDate = new Date(lastActive);
      if (lastActiveDate < startDate) {
        continue;
      }
    }

    const completionRate = totalSlides > 0
      ? Math.round((totalSlidesViewed / totalSlides) * 100)
      : 0;
    const avgQuizScore = quizAttempts > 0
      ? Math.round(totalQuizScore / quizAttempts)
      : 0;

    students.push({
      studentId: student.student_id,
      studentName: student.student_name,
      studentPhone: student.student_phone,
      classId: student.class_id,
      className: student.class_name,
      completionRate,
      assignmentsCompleted,
      totalAssignments,
      avgQuizScore,
      quizAttempts,
      totalTimeMinutes,
      lastActive,
    });
  }

  // Calculate stats
  const totalStudents = students.length;
  const avgCompletion = totalStudents > 0
    ? Math.round(students.reduce((sum, s) => sum + s.completionRate, 0) / totalStudents)
    : 0;
  const avgQuizScore = totalStudents > 0
    ? Math.round(students.reduce((sum, s) => sum + s.avgQuizScore, 0) / totalStudents)
    : 0;
  const avgTimeMinutes = totalStudents > 0
    ? Math.round(students.reduce((sum, s) => sum + s.totalTimeMinutes, 0) / totalStudents)
    : 0;

  // Mock trends for now (in a real app, compare to previous period)
  const studentTrend = 0;
  const completionTrend = 0;
  const scoreTrend = 0;

  // Get classes for filter dropdown
  const classes = await getTeacherClasses(teacherId);

  // Generate mock completion timeline data
  const completionTimeline: Array<{ date: string; completion: number }> = [];
  const days = filters.dateRange === 'week' ? 7 : filters.dateRange === 'month' ? 30 : 90;
  for (let i = days; i >= 0; i -= 7) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    completionTimeline.push({
      date: date.toISOString().split('T')[0],
      completion: Math.round(50 + Math.random() * 40),
    });
  }

  // Generate mock quiz score distribution
  const quizDistribution: Array<{ range: string; count: number }> = [
    { range: '0-20', count: 0 },
    { range: '21-40', count: 0 },
    { range: '41-60', count: 0 },
    { range: '61-80', count: 0 },
    { range: '81-100', count: 0 },
  ];

  for (const student of students) {
    if (student.avgQuizScore > 0) {
      const bucket = Math.floor((student.avgQuizScore - 1) / 20);
      const bucketIndex = Math.min(bucket, 4);
      quizDistribution[bucketIndex].count++;
    }
  }

  return {
    students,
    stats: {
      totalStudents,
      avgCompletion,
      avgQuizScore,
      avgTimeMinutes,
      studentTrend,
      completionTrend,
      scoreTrend,
    },
    classes,
    completionTimeline,
    quizDistribution,
  };
}

// GET /api/teacher/progress/teacher - Get aggregated progress for all teacher's classes
export const GET = withRole(['teacher'], async (
  req: NextRequest,
  ctx: AuthContext,
  _routeCtx: RouteContext
) => {
  const url = new URL(req.url);
  const filters: ProgressFilters = {};

  const classId = url.searchParams.get('classId');
  if (classId) {
    filters.classId = classId;
  }

  const dateRange = url.searchParams.get('dateRange') as 'week' | 'month' | 'all' | null;
  if (dateRange && ['week', 'month', 'all'].includes(dateRange)) {
    filters.dateRange = dateRange;
  } else {
    filters.dateRange = 'month';
  }

  const progressData = await getTeacherProgressData(ctx.user.id, filters);

  return NextResponse.json({
    students: progressData.students,
    stats: progressData.stats,
    classes: progressData.classes,
    completionTimeline: progressData.completionTimeline,
    quizDistribution: progressData.quizDistribution,
  });
});
