import { getDb } from '../db';

export interface ProgressFilters {
  assignmentId?: string;
  status?: 'all' | 'completed' | 'not_started' | 'low_score';
  dateFrom?: string;
  dateTo?: string;
}

export interface StudentProgress {
  studentId: string;
  studentName: string;
  studentPhone: string;
  assignments: AssignmentProgress[];
}

export interface AssignmentProgress {
  assignmentId: string;
  assignmentTitle: string;
  slidesViewed: number;
  totalSlides: number;
  slidesCompleted: boolean;
  quizCompleted: boolean;
  quizScorePercent: number | null;
  totalTimeMinutes: number;
  lastActivityAt: string | null;
}

export interface ClassProgressResult {
  classId: string;
  className: string;
  students: StudentProgress[];
  totalStudents: number;
}

export interface AssignmentProgressResult {
  assignmentId: string;
  assignmentTitle: string;
  totalStudents: number;
  completedCount: number;
  averageScore: number | null;
  students: StudentProgress[];
}

export function getClassProgress(classId: string, filters?: ProgressFilters): ClassProgressResult | null {
  const db = getDb();

  // Verify class exists and get its name
  const classRecord = db.prepare('SELECT id, name FROM classes WHERE id = ?').get(classId) as { id: string; name: string } | undefined;
  if (!classRecord) {
    return null;
  }

  // Get all students in the class
  const studentQuery = `
    SELECT DISTINCT u.id as student_id, u.name as student_name, u.phone_e164 as student_phone
    FROM users u
    INNER JOIN class_memberships cm ON cm.student_id = u.id
    WHERE cm.class_id = ?
  `;

  const students = db.prepare(studentQuery).all(classId) as Array<{
    student_id: string;
    student_name: string;
    student_phone: string;
  }>;

  // Get all assignments for this class
  let assignmentQuery = `
    SELECT a.id, a.title, a.slide_asset_version_id
    FROM assignments a
    WHERE a.class_id = ? AND a.status = 'released'
  `;
  const assignmentParams: string[] = [classId];

  if (filters?.assignmentId) {
    assignmentQuery += ' AND a.id = ?';
    assignmentParams.push(filters.assignmentId);
  }

  const assignments = db.prepare(assignmentQuery).all(...assignmentParams) as Array<{
    id: string;
    title: string;
    slide_asset_version_id: string | null;
  }>;

  if (assignments.length === 0 || students.length === 0) {
    return {
      classId,
      className: classRecord.name,
      students: students.map((s) => ({
        studentId: s.student_id,
        studentName: s.student_name,
        studentPhone: s.student_phone,
        assignments: []
      })),
      totalStudents: students.length
    };
  }

  const assignmentIds = assignments.map((a) => a.id);
  const placeholders = assignmentIds.map(() => '?').join(', ');

  // Batch fetch slide progress for all students/assignments
  const slideProgressRows = db.prepare(`
    SELECT assignment_id, student_id, COUNT(DISTINCT slide_id) as slides_viewed
    FROM assignment_slide_progress
    WHERE assignment_id IN (${placeholders})
    GROUP BY assignment_id, student_id
  `).all(...assignmentIds) as Array<{ assignment_id: string; student_id: string; slides_viewed: number }>;

  const slideProgressMap = new Map<string, number>();
  slideProgressRows.forEach((row) => {
    slideProgressMap.set(`${row.assignment_id}:${row.student_id}`, row.slides_viewed);
  });

  // Compute total slides per assignment from payload_json
  const totalSlidesMap = new Map<string, number>();
  for (const assignment of assignments) {
    if (!assignment.slide_asset_version_id) {
      totalSlidesMap.set(assignment.id, 0);
      continue;
    }
    const versionRow = db.prepare(`
      SELECT payload_json FROM content_asset_versions WHERE id = ?
    `).get(assignment.slide_asset_version_id) as { payload_json: string } | undefined;
    if (!versionRow) {
      totalSlidesMap.set(assignment.id, 0);
      continue;
    }
    try {
      const payload = JSON.parse(versionRow.payload_json);
      const slideCount = Array.isArray(payload.slides) ? payload.slides.length : 0;
      totalSlidesMap.set(assignment.id, slideCount);
    } catch {
      totalSlidesMap.set(assignment.id, 0);
    }
  }

  // Batch fetch attempts
  const attemptRows = db.prepare(`
    SELECT assignment_id, student_id, score_percent, submitted_at, started_at
    FROM assignment_attempts
    WHERE assignment_id IN (${placeholders})
  `).all(...assignmentIds) as Array<{
    assignment_id: string;
    student_id: string;
    score_percent: number | null;
    submitted_at: string | null;
    started_at: string;
  }>;

  const attemptMap = new Map<string, { score_percent: number | null; submitted_at: string | null; started_at: string }>();
  attemptRows.forEach((row) => {
    attemptMap.set(`${row.assignment_id}:${row.student_id}`, row);
  });

  // Batch fetch last slide view per student/assignment
  const lastViewRows = db.prepare(`
    SELECT assignment_id, student_id, MAX(viewed_at) as last_view
    FROM assignment_slide_progress
    WHERE assignment_id IN (${placeholders})
    GROUP BY assignment_id, student_id
  `).all(...assignmentIds) as Array<{ assignment_id: string; student_id: string; last_view: string | null }>;

  const lastViewMap = new Map<string, string | null>();
  lastViewRows.forEach((row) => {
    lastViewMap.set(`${row.assignment_id}:${row.student_id}`, row.last_view);
  });

  // Build progress data for each student
  const studentProgressList: StudentProgress[] = students.map((student) => {
    const assignmentProgressList: AssignmentProgress[] = assignments.map((assignment) => {
      const key = `${assignment.id}:${student.student_id}`;
      const slidesViewed = slideProgressMap.get(key) || 0;
      const totalSlides = totalSlidesMap.get(assignment.id) || 0;
      const attempt = attemptMap.get(key);
      const lastSlideView = lastViewMap.get(key) || null;
      const lastActivityAt = [lastSlideView, attempt?.started_at]
        .filter(Boolean)
        .sort()
        .pop() || null;

      let totalTimeMinutes = 0;
      if (attempt) {
        const startTime = new Date(attempt.started_at).getTime();
        const endTime = attempt.submitted_at
          ? new Date(attempt.submitted_at).getTime()
          : Date.now();
        totalTimeMinutes = Math.round((endTime - startTime) / 60000);
      }

      return {
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        slidesViewed,
        totalSlides,
        slidesCompleted: totalSlides > 0 && slidesViewed >= totalSlides,
        quizCompleted: !!attempt?.submitted_at,
        quizScorePercent: attempt?.score_percent ?? null,
        totalTimeMinutes,
        lastActivityAt
      };
    });

    return {
      studentId: student.student_id,
      studentName: student.student_name,
      studentPhone: student.student_phone,
      assignments: assignmentProgressList
    };
  });

  // Apply filters
  let filteredStudents = studentProgressList;

  if (filters?.status && filters.status !== 'all') {
    filteredStudents = filteredStudents.filter((sp) => {
      const allAssignments = sp.assignments;
      if (allAssignments.length === 0) {
        return filters.status === 'not_started';
      }

      switch (filters.status) {
        case 'completed':
          return allAssignments.every((a) => a.slidesCompleted && a.quizCompleted);
        case 'not_started':
          return allAssignments.every((a) => a.slidesViewed === 0 && !a.quizCompleted);
        case 'low_score':
          return allAssignments.some((a) => a.quizScorePercent !== null && a.quizScorePercent < 60);
        default:
          return true;
      }
    });
  }

  if (filters?.dateFrom) {
    const fromDate = new Date(filters.dateFrom);
    filteredStudents = filteredStudents.filter((sp) =>
      sp.assignments.some((a) => a.lastActivityAt && new Date(a.lastActivityAt) >= fromDate)
    );
  }

  if (filters?.dateTo) {
    const toDate = new Date(filters.dateTo);
    filteredStudents = filteredStudents.filter((sp) =>
      sp.assignments.some((a) => a.lastActivityAt && new Date(a.lastActivityAt) <= toDate)
    );
  }

  return {
    classId,
    className: classRecord.name,
    students: filteredStudents,
    totalStudents: filteredStudents.length
  };
}

export function getAssignmentProgress(assignmentId: string): AssignmentProgressResult | null {
  const db = getDb();

  // Verify assignment exists and get title
  const assignment = db.prepare(`
    SELECT a.id, a.title, a.class_id
    FROM assignments a
    WHERE a.id = ?
  `).get(assignmentId) as { id: string; title: string; class_id: string } | undefined;

  if (!assignment) {
    return null;
  }

  // Get all students in the class
  const students = db.prepare(`
    SELECT DISTINCT u.id as student_id, u.name as student_name, u.phone_e164 as student_phone
    FROM users u
    INNER JOIN class_memberships cm ON cm.student_id = u.id
    WHERE cm.class_id = ?
  `).all(assignment.class_id) as Array<{
    student_id: string;
    student_name: string;
    student_phone: string;
  }>;

  // Get slide progress for this assignment
  const slideProgressMap = new Map<string, number>();
  const slideProgressRows = db.prepare(`
    SELECT student_id, COUNT(DISTINCT slide_id) as slides_viewed
    FROM assignment_slide_progress
    WHERE assignment_id = ?
    GROUP BY student_id
  `).all(assignmentId) as Array<{ student_id: string; slides_viewed: number }>;

  slideProgressRows.forEach((row) => {
    slideProgressMap.set(row.student_id, row.slides_viewed);
  });

  // Get total slides from slide asset payload_json
  let totalSlides = 0;
  const assignmentRow = db.prepare('SELECT slide_asset_version_id FROM assignments WHERE id = ?').get(assignmentId) as { slide_asset_version_id: string | null } | undefined;
  if (assignmentRow?.slide_asset_version_id) {
    const versionRow = db.prepare('SELECT payload_json FROM content_asset_versions WHERE id = ?').get(assignmentRow.slide_asset_version_id) as { payload_json: string } | undefined;
    if (versionRow) {
      try {
        const payload = JSON.parse(versionRow.payload_json);
        totalSlides = Array.isArray(payload.slides) ? payload.slides.length : 0;
      } catch {
        totalSlides = 0;
      }
    }
  }

  // Get attempt data for all students
  const attemptMap = new Map<string, { score_percent: number | null; submitted_at: string | null; started_at: string }>();
  const attemptRows = db.prepare(`
    SELECT student_id, score_percent, submitted_at, started_at
    FROM assignment_attempts
    WHERE assignment_id = ?
  `).all(assignmentId) as Array<{
    student_id: string;
    score_percent: number | null;
    submitted_at: string | null;
    started_at: string;
  }>;

  attemptRows.forEach((row) => {
    attemptMap.set(row.student_id, row);
  });

  let completedCount = 0;
  let scoreSum = 0;
  let scoreCount = 0;

  const studentProgressList: StudentProgress[] = students.map((student) => {
    const slidesViewed = slideProgressMap.get(student.student_id) || 0;
    const attempt = attemptMap.get(student.student_id);

    const assignmentProgress: AssignmentProgress = {
      assignmentId,
      assignmentTitle: assignment.title,
      slidesViewed,
      totalSlides,
      slidesCompleted: totalSlides > 0 && slidesViewed >= totalSlides,
      quizCompleted: !!attempt?.submitted_at,
      quizScorePercent: attempt?.score_percent ?? null,
      totalTimeMinutes: 0, // Not calculated for single assignment view
      lastActivityAt: attempt?.started_at || null
    };

    if (assignmentProgress.slidesCompleted && assignmentProgress.quizCompleted) {
      completedCount++;
    }

    if (attempt?.score_percent !== null && attempt?.score_percent !== undefined) {
      scoreSum += attempt.score_percent;
      scoreCount++;
    }

    return {
      studentId: student.student_id,
      studentName: student.student_name,
      studentPhone: student.student_phone,
      assignments: [assignmentProgress]
    };
  });

  return {
    assignmentId,
    assignmentTitle: assignment.title,
    totalStudents: students.length,
    completedCount,
    averageScore: scoreCount > 0 ? Math.round((scoreSum / scoreCount) * 100) / 100 : null,
    students: studentProgressList
  };
}

export function exportToCSV(classId: string, filters?: ProgressFilters): string {
  const progress = getClassProgress(classId, filters);

  if (!progress) {
    return '';
  }

  const headers = [
    'student_name',
    'student_phone',
    'assignment_title',
    'slides_viewed',
    'quiz_completed',
    'quiz_score_percent',
    'total_time_minutes',
    'last_activity_at'
  ];

  const rows: string[] = [headers.join(',')];

  for (const student of progress.students) {
    for (const assignment of student.assignments) {
      const row = [
        escapeCSV(student.studentName),
        escapeCSV(student.studentPhone),
        escapeCSV(assignment.assignmentTitle),
        assignment.slidesViewed.toString(),
        assignment.quizCompleted ? 'yes' : 'no',
        assignment.quizScorePercent !== null ? assignment.quizScorePercent.toString() : '',
        assignment.totalTimeMinutes.toString(),
        assignment.lastActivityAt ? new Date(assignment.lastActivityAt).toISOString() : ''
      ];
      rows.push(row.join(','));
    }

    // If student has no assignments, still include a row for them
    if (student.assignments.length === 0) {
      const row = [
        escapeCSV(student.studentName),
        escapeCSV(student.studentPhone),
        '',
        '',
        '',
        '',
        '',
        ''
      ];
      rows.push(row.join(','));
    }
  }

  return rows.join('\n');
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
