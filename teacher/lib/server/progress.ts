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
  aiInsights?: string[];
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

export async function getClassProgress(classId: string, filters?: ProgressFilters): Promise<ClassProgressResult | null> {
  const db = getDb();

  const classResult = await db.query('SELECT id, name FROM classes WHERE id = $1', [classId]);
  const classRecord = classResult.rows[0] as { id: string; name: string } | undefined;
  if (!classRecord) {
    return null;
  }

  const studentsResult = await db.query(`
    SELECT DISTINCT u.id as student_id, u.name as student_name, u.phone_e164 as student_phone
    FROM users u
    INNER JOIN class_memberships cm ON cm.student_id = u.id
    WHERE cm.class_id = $1
  `, [classId]);

  const students = studentsResult.rows as Array<{
    student_id: string;
    student_name: string;
    student_phone: string;
  }>;

  let assignmentQuery = `
    SELECT a.id, a.title, a.slide_asset_version_id
    FROM assignments a
    WHERE a.class_id = $1 AND a.status = 'released'
  `;
  const assignmentParams: string[] = [classId];

  if (filters?.assignmentId) {
    assignmentQuery += ' AND a.id = $2';
    assignmentParams.push(filters.assignmentId);
  }

  const assignmentsResult = await db.query(assignmentQuery, assignmentParams);
  const assignments = assignmentsResult.rows as Array<{
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
  const placeholders = assignmentIds.map((_, i) => `$${i + 1}`).join(', ');

  const slideProgressResult = await db.query(`
    SELECT assignment_id, student_id, COUNT(DISTINCT slide_id) as slides_viewed
    FROM assignment_slide_progress
    WHERE assignment_id IN (${placeholders})
    GROUP BY assignment_id, student_id
  `, assignmentIds);

  const slideProgressMap = new Map<string, number>();
  slideProgressResult.rows.forEach((row: any) => {
    slideProgressMap.set(`${row.assignment_id}:${row.student_id}`, row.slides_viewed);
  });

  const totalSlidesMap = new Map<string, number>();
  for (const assignment of assignments) {
    if (!assignment.slide_asset_version_id) {
      totalSlidesMap.set(assignment.id, 0);
      continue;
    }
    const versionResult = await db.query(`
      SELECT payload_json FROM content_asset_versions WHERE id = $1
    `, [assignment.slide_asset_version_id]);
    const versionRow = versionResult.rows[0] as { payload_json: string } | undefined;
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

  const attemptResult = await db.query(`
    SELECT assignment_id, student_id, score_percent, submitted_at, started_at
    FROM assignment_attempts
    WHERE assignment_id IN (${placeholders})
  `, assignmentIds);

  const attemptMap = new Map<string, { score_percent: number | null; submitted_at: string | null; started_at: string }>();
  attemptResult.rows.forEach((row: any) => {
    attemptMap.set(`${row.assignment_id}:${row.student_id}`, row);
  });

  const lastViewResult = await db.query(`
    SELECT assignment_id, student_id, MAX(viewed_at) as last_view
    FROM assignment_slide_progress
    WHERE assignment_id IN (${placeholders})
    GROUP BY assignment_id, student_id
  `, assignmentIds);

  const lastViewMap = new Map<string, string | null>();
  lastViewResult.rows.forEach((row: any) => {
    lastViewMap.set(`${row.assignment_id}:${row.student_id}`, row.last_view);
  });

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

    // Real, data-derived insights. We use the per-student progress that's
    // already been computed so the panel reflects observed activity instead
    // of scripted "Algebra" copy.
    const scored = assignmentProgressList.filter((a) => a.quizScorePercent !== null);
    const notStarted = assignmentProgressList.filter((a) => a.slidesViewed === 0 && !a.quizCompleted).length;
    const inProgress = assignmentProgressList.filter((a) => a.slidesViewed > 0 && !a.quizCompleted).length;
    const averageScore = scored.length === 0
      ? null
      : Math.round(
          (scored.reduce((s, a) => s + (a.quizScorePercent ?? 0), 0) / scored.length) * 100
        ) / 100;

    const insights: string[] = [];
    if (scored.length === 0) {
      insights.push('No quiz attempts yet — encourage the student to start a quiz.');
    } else {
      if (averageScore !== null && averageScore < 60) {
        insights.push(`Average quiz score: ${averageScore}% — needs targeted practice.`);
      } else if (averageScore !== null && averageScore < 80) {
        insights.push(`Average quiz score: ${averageScore}% — solid but inconsistent.`);
      } else if (averageScore !== null) {
        insights.push(`Average quiz score: ${averageScore}% — strong performance.`);
      }
      if (notStarted > 0) {
        insights.push(`${notStarted} assignment${notStarted === 1 ? '' : 's'} not started.`);
      }
      if (inProgress > 0) {
        insights.push(`${inProgress} assignment${inProgress === 1 ? '' : 's'} in progress.`);
      }
    }

    return {
      studentId: student.student_id,
      studentName: student.student_name,
      studentPhone: student.student_phone,
      assignments: assignmentProgressList,
      aiInsights: insights
    };
  });

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

export async function getAssignmentProgress(assignmentId: string): Promise<AssignmentProgressResult | null> {
  const db = getDb();

  const assignmentResult = await db.query(`
    SELECT a.id, a.title, a.class_id
    FROM assignments a
    WHERE a.id = $1
  `, [assignmentId]);

  const assignment = assignmentResult.rows[0] as { id: string; title: string; class_id: string } | undefined;

  if (!assignment) {
    return null;
  }

  const studentsResult = await db.query(`
    SELECT DISTINCT u.id as student_id, u.name as student_name, u.phone_e164 as student_phone
    FROM users u
    INNER JOIN class_memberships cm ON cm.student_id = u.id
    WHERE cm.class_id = $1
  `, [assignment.class_id]);

  const students = studentsResult.rows as Array<{
    student_id: string;
    student_name: string;
    student_phone: string;
  }>;

  const slideProgressResult = await db.query(`
    SELECT student_id, COUNT(DISTINCT slide_id) as slides_viewed
    FROM assignment_slide_progress
    WHERE assignment_id = $1
    GROUP BY student_id
  `, [assignmentId]);

  const slideProgressMap = new Map<string, number>();
  slideProgressResult.rows.forEach((row: any) => {
    slideProgressMap.set(row.student_id, row.slides_viewed);
  });

  let totalSlides = 0;
  const assignmentRowResult = await db.query('SELECT slide_asset_version_id FROM assignments WHERE id = $1', [assignmentId]);
  const assignmentRow = assignmentRowResult.rows[0] as { slide_asset_version_id: string | null } | undefined;
  if (assignmentRow?.slide_asset_version_id) {
    const versionResult = await db.query('SELECT payload_json FROM content_asset_versions WHERE id = $1', [assignmentRow.slide_asset_version_id]);
    const versionRow = versionResult.rows[0] as { payload_json: string } | undefined;
    if (versionRow) {
      try {
        const payload = JSON.parse(versionRow.payload_json);
        totalSlides = Array.isArray(payload.slides) ? payload.slides.length : 0;
      } catch {
        totalSlides = 0;
      }
    }
  }

  const attemptResult = await db.query(`
    SELECT student_id, score_percent, submitted_at, started_at
    FROM assignment_attempts
    WHERE assignment_id = $1
  `, [assignmentId]);

  const attemptMap = new Map<string, { score_percent: number | null; submitted_at: string | null; started_at: string }>();
  attemptResult.rows.forEach((row: any) => {
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
      totalTimeMinutes: 0,
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

export async function exportToCSV(classId: string, filters?: ProgressFilters): Promise<string> {
  const progress = await getClassProgress(classId, filters);

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

// ---------------------------------------------------------------------------
// Per-student deep-dive: event timeline + sparkline data
// ---------------------------------------------------------------------------

export interface StudentEvent {
  id: string;
  eventType: string;
  relatedId: string | null;
  score: number | null;
  durationSeconds: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface StudentProgressSummary {
  studentId: string;
  studentName: string;
  studentPhone: string;
  className: string;
  classId: string;
  totalEvents: number;
  assignmentCompleted: number;
  assignmentStarted: number;
  quizAttempts: number;
  avgQuizScore: number | null;
  sessionJoined: number;
  logins: number;
  totalDurationMinutes: number;
  lastActiveAt: string | null;
  firstEventAt: string | null;
  events: StudentEvent[];
  /** Daily activity counts for sparkline (last 30 days, oldest→newest) */
  sparkline: Array<{ date: string; count: number }>;
}

export async function getStudentProgressEvents(
  studentId: string,
  classId: string | undefined,
  teacherId: string,
  days = 30
): Promise<StudentProgressSummary | null> {
  const db = getDb();

  // Resolve student + class. The teacherId clause ensures we never pivot
  // into a class owned by another teacher when the student is enrolled in
  // multiple classrooms.
  const studentResult = await db.query(
    `SELECT u.id, u.name, u.phone_e164, cm.class_id, c.name as class_name
     FROM users u
     INNER JOIN class_memberships cm ON cm.student_id = u.id
     INNER JOIN classes c ON c.id = cm.class_id
     WHERE u.id = $1
       AND u.role IN ('student_classroom', 'student_b2c')
       AND c.teacher_id = $2
       ${classId ? 'AND cm.class_id = $3' : ''}
     ORDER BY cm.enrolled_at DESC
     LIMIT 1`,
    classId ? [studentId, teacherId, classId] : [studentId, teacherId]
  );

  const student = studentResult.rows[0] as
    | { id: string; name: string; phone_e164: string; class_id: string; class_name: string }
    | undefined;

  if (!student) return null;

  const resolvedClassId = student.class_id;

  // Fetch events within the lookback window
  const since = new Date();
  since.setDate(since.getDate() - days);

  const eventsResult = await db.query(
    `SELECT id, event_type, related_id, score, duration_seconds, metadata, created_at
     FROM student_progress_events
     WHERE student_id = $1 AND class_id = $2 AND created_at >= $3
     ORDER BY created_at DESC`,
    [studentId, resolvedClassId, since.toISOString()]
  );

  const events: StudentEvent[] = eventsResult.rows.map((row: any) => ({
    id: row.id,
    eventType: row.event_type,
    relatedId: row.related_id,
    score: row.score,
    durationSeconds: row.duration_seconds,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
    createdAt: row.created_at,
  }));

  // Aggregate counts
  let assignmentCompleted = 0;
  let assignmentStarted = 0;
  let quizAttempts = 0;
  let sessionJoined = 0;
  let logins = 0;
  let totalDurationSeconds = 0;
  let quizScoreSum = 0;
  let quizScoreCount = 0;

  for (const e of events) {
    switch (e.eventType) {
      case 'assignment_completed':
        assignmentCompleted++;
        break;
      case 'assignment_started':
        assignmentStarted++;
        break;
      case 'quiz_attempt':
        quizAttempts++;
        if (e.score != null) {
          quizScoreSum += e.score;
          quizScoreCount++;
        }
        break;
      case 'session_joined':
        sessionJoined++;
        break;
      case 'login':
        logins++;
        break;
    }
    if (e.durationSeconds) {
      totalDurationSeconds += e.durationSeconds;
    }
  }

  // Build sparkline: daily event counts for the last N days
  const sparklineMap = new Map<string, number>();
  // Pre-fill all days with 0 so the chart has a continuous axis
  for (let d = days - 1; d >= 0; d--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - d);
    const key = dt.toISOString().split('T')[0];
    sparklineMap.set(key, 0);
  }
  for (const e of events) {
    const key = e.createdAt.split('T')[0];
    if (sparklineMap.has(key)) {
      sparklineMap.set(key, (sparklineMap.get(key) || 0) + 1);
    }
  }
  const sparkline = Array.from(sparklineMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const lastActiveAt = events.length > 0 ? events[0].createdAt : null;
  const firstEventAt = events.length > 0 ? events[events.length - 1].createdAt : null;

  return {
    studentId: student.id,
    studentName: student.name,
    studentPhone: student.phone_e164,
    className: student.class_name,
    classId: resolvedClassId,
    totalEvents: events.length,
    assignmentCompleted,
    assignmentStarted,
    quizAttempts,
    avgQuizScore: quizScoreCount > 0 ? Math.round((quizScoreSum / quizScoreCount) * 100) / 100 : null,
    sessionJoined,
    logins,
    totalDurationMinutes: Math.round(totalDurationSeconds / 60),
    lastActiveAt,
    firstEventAt,
    events,
    sparkline,
  };
}

// ---------------------------------------------------------------------------
// Weakness profile: aggregate per-question results across all of a student's
// attempts in the teacher's class. Bug #14 surfaced that the previous
// `graded.results` payload was discarded at submit time, so a profile could
// only ever show the per-quiz score. We now persist per_question_json and
// roll it up by question type (the schema has no topic column to group by).
// ---------------------------------------------------------------------------

export interface QuestionTypeBreakdown {
  type: string;
  total: number;
  correct: number;
  accuracy: number | null;
  pointsEarned: number;
  totalPoints: number;
}

export interface WeaknessProfile {
  studentId: string;
  classId: string;
  className: string;
  attemptsAnalyzed: number;
  totalQuestions: number;
  overallAccuracy: number | null;
  weakestType: QuestionTypeBreakdown | null;
  strongestType: QuestionTypeBreakdown | null;
  byType: QuestionTypeBreakdown[];
}

interface PerQuestionResult {
  id?: string;
  type?: string;
  totalPoints?: number;
  pointsEarned?: number;
  isCorrect?: boolean;
  openEnded?: boolean;
}

export async function getWeaknessProfile(
  studentId: string,
  teacherId: string,
  classId?: string
): Promise<WeaknessProfile | null> {
  const db = getDb();

  // Resolve and authorize the student. Mirrors getStudentProgressEvents.
  const studentResult = await db.query(
    `SELECT u.id, u.name, cm.class_id, c.name as class_name
     FROM users u
     INNER JOIN class_memberships cm ON cm.student_id = u.id
     INNER JOIN classes c ON c.id = cm.class_id
     WHERE u.id = $1
       AND u.role IN ('student_classroom', 'student_b2c')
       AND c.teacher_id = $2
       ${classId ? 'AND cm.class_id = $3' : ''}
     ORDER BY cm.enrolled_at DESC
     LIMIT 1`,
    classId ? [studentId, teacherId, classId] : [studentId, teacherId]
  );

  const student = studentResult.rows[0] as
    | { id: string; name: string; class_id: string; class_name: string }
    | undefined;

  if (!student) return null;

  const attemptsResult = await db.query(
    `SELECT score_percent, per_question_json
     FROM assignment_attempts
     WHERE student_id = $1
       AND per_question_json IS NOT NULL
       AND assignment_id IN (
         SELECT a.id FROM assignments a
         JOIN classes c ON c.id = a.class_id
         WHERE c.teacher_id = $2
           ${classId ? 'AND a.class_id = $3' : ''}
       )`,
    classId ? [studentId, teacherId, classId] : [studentId, teacherId]
  );

  const tally = new Map<string, QuestionTypeBreakdown>();
  let totalQuestions = 0;
  let totalCorrect = 0;
  let totalPoints = 0;
  let totalEarned = 0;

  for (const row of attemptsResult.rows as Array<{ score_percent: number | null; per_question_json: unknown }>) {
    const raw = row.per_question_json;
    if (!Array.isArray(raw)) continue;
    for (const entry of raw as PerQuestionResult[]) {
      const type = entry.type ?? 'unknown';
      const earned = entry.pointsEarned ?? 0;
      const max = entry.totalPoints ?? 0;
      const correct = entry.isCorrect === true;
      const existing = tally.get(type) ?? {
        type,
        total: 0,
        correct: 0,
        accuracy: null,
        pointsEarned: 0,
        totalPoints: 0,
      };
      existing.total += 1;
      if (correct) existing.correct += 1;
      existing.pointsEarned += earned;
      existing.totalPoints += max;
      tally.set(type, existing);
      totalQuestions += 1;
      if (correct) totalCorrect += 1;
      totalPoints += max;
      totalEarned += earned;
    }
  }

  const byType = Array.from(tally.values()).map((b) => ({
    ...b,
    accuracy: b.total > 0 ? Math.round((b.correct / b.total) * 1000) / 10 : null,
  }));
  byType.sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0));

  const weakestType = byType.find((b) => b.total > 0) ?? null;
  const strongestType = byType.length > 0 ? byType[byType.length - 1] : null;

  return {
    studentId: student.id,
    classId: student.class_id,
    className: student.class_name,
    attemptsAnalyzed: attemptsResult.rows.length,
    totalQuestions,
    overallAccuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 1000) / 10 : null,
    weakestType: weakestType && weakestType.total > 0 ? weakestType : null,
    strongestType: strongestType && strongestType.total > 0 ? strongestType : null,
    byType,
  };
}
