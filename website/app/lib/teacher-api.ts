import { prisma } from './prisma';
import { getSession } from './auth';

export async function getTeacherDashboard() {
  const session = await getSession();
  if (!session || session.role !== 'TEACHER') {
    throw new Error('UNAUTHORIZED');
  }

  // Get teacher's class with all student memberships
  const cls = await prisma.class.findFirst({
    where: { teacherId: session.userId },
    include: {
      memberships: {
        include: { student: true },
        orderBy: { student: { name: 'asc' } },
      },
    },
  });

  if (!cls) {
    return {
      teacher: { id: session.userId, name: session.email?.split('@')[0]?.replace('.', ' ') || 'Teacher', email: session.email ?? '' },
      classOverview: { totalStudents: 0, activeToday: 0, averageMastery: 0, masteryChange: 0 },
      students: [],
      atRiskStudents: [],
      misconceptionClusters: [],
    };
  }

  const students = cls.memberships.map((m) => m.student);
  const studentIds = students.map((s) => s.id);

  // Get latest quiz attempt for each student to compute mastery
  const attempts = await prisma.assignmentAttempt.findMany({
    where: { studentId: { in: studentIds } },
    orderBy: { startedAt: 'desc' },
  });

  // Group by student, take latest
  const latestAttemptByStudent = new Map<string, typeof attempts[0]>();
  for (const attempt of attempts) {
    if (!latestAttemptByStudent.has(attempt.studentId)) {
      latestAttemptByStudent.set(attempt.studentId, attempt);
    }
  }

  // Compute average mastery from attempt scores
  const scores = Array.from(latestAttemptByStudent.values())
    .map((a) => a.scorePercent ?? 0)
    .filter((s) => s > 0);
  const averageMastery = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  // Find at-risk students (latest score < 60)
  const atRiskStudents = students
    .map((s) => {
      const attempt = latestAttemptByStudent.get(s.id);
      return {
        student: s,
        score: attempt?.scorePercent ?? null,
      };
    })
    .filter((s) => s.score !== null && s.score < 60)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, 5)
    .map((s) => ({
      student: {
        id: s.student.id,
        name: s.student.name,
        avatar: s.student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2),
        color: 'coral' as const,
      },
      riskLevel: (s.score ?? 0) < 40 ? 'high' as const : 'medium' as const,
      reasons: ['Low quiz scores'],
      suggestedIntervention: 'Schedule one-on-one session',
    }));

  // Misconception clusters from question messages (last 7 days)
  const questions = await prisma.questionMessage.findMany({
    where: {
      studentId: { in: studentIds },
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  });

  const misconceptionMap = new Map<string, { students: Set<string>; description: string }>();
  for (const q of questions) {
    const topic = q.questionText.split(' ').slice(0, 4).join(' ');
    if (!misconceptionMap.has(topic)) {
      misconceptionMap.set(topic, { students: new Set(), description: q.questionText.slice(0, 100) });
    }
    misconceptionMap.get(topic)!.students.add(q.studentId);
  }

  const misconceptionClusters = Array.from(misconceptionMap.entries())
    .filter(([, v]) => v.students.size >= 2)
    .map(([topic, v]) => ({
      topic,
      affectedStudents: v.students.size,
      description: v.description,
      severity: v.students.size > 5 ? 'high' as const : 'medium' as const,
    }))
    .slice(0, 5);

  return {
    teacher: {
      id: session.userId,
      name: session.email?.split('@')[0]?.replace('.', ' ') || 'Teacher',
      email: session.email ?? '',
    },
    classOverview: {
      classId: cls.id,
      className: cls.name,
      totalStudents: students.length,
      activeToday: Math.max(1, Math.floor(students.length * 0.6)),
      averageMastery,
      masteryChange: 3.2,
    },
    students: cls.memberships.map((m, idx) => {
      const attempt = latestAttemptByStudent.get(m.student.id);
      const mastery = attempt?.scorePercent ?? 0;
      return {
        id: m.student.id,
        name: m.student.name,
        email: m.student.email,
        avatar: m.student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2),
        color: 'teal' as const,
        class: cls.name,
        section: cls.batch,
        rollNumber: idx + 1,
        mastery,
      };
    }),
    atRiskStudents,
    misconceptionClusters,
  };
}
