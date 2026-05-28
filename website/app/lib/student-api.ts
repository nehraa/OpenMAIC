import { prisma } from './prisma';
import { getSession } from './auth';

export async function getStudentDashboard(studentId?: string) {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT_CLASSROOM') {
    throw new Error('UNAUTHORIZED');
  }

  // Use provided studentId or fall back to session userId
  const targetId = studentId || session.userId;

  // Get student's class membership
  const membership = await prisma.classMembership.findFirst({
    where: { studentId: targetId },
    include: {
      class: {
        include: {
          teacher: true,
        },
      },
    },
  });

  if (!membership) {
    return {
      student: null,
      currentLesson: null,
      assignedHomework: [],
      recentQuizzes: [],
      overallMastery: 0,
      streakDays: 0,
      masteryLevels: [],
      misconceptions: [],
      teachingGuidance: null,
    };
  }

  const student = await prisma.user.findUnique({ where: { id: targetId } });
  if (!student) {
    throw new Error('NOT_FOUND');
  }

  // Get assignment recipients with their assignments
  const recipients = await prisma.assignmentRecipient.findMany({
    where: { studentId: targetId },
    include: { assignment: true },
    orderBy: { assignedAt: 'desc' },
    take: 10,
  });

  // Get attempt history
  const attempts = await prisma.assignmentAttempt.findMany({
    where: { studentId: targetId },
    include: { assignment: true },
    orderBy: { startedAt: 'desc' },
    take: 10,
  });

  const attemptMap = new Map(attempts.map((a) => [a.assignmentId, a]));

  // Get recent questions/misconceptions
  const questions = await prisma.questionMessage.findMany({
    where: { studentId: targetId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Compute mastery from attempts
  const scores = attempts.map((a) => a.scorePercent ?? 0).filter((s) => s > 0);
  const overallMastery = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  return {
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      avatar: student.name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2),
      color: 'teal' as const,
      class: membership.class.name,
      section: membership.class.batch,
      rollNumber: 1,
      learningStyle: null, // Learning styles tracked separately in Phase 2
    },
    currentLesson: {
      lessonId: recipients[0]?.assignment.id ?? '',
      lessonName: recipients[0]?.assignment.title ?? 'Welcome!',
      completedPercentage: attemptMap.get(recipients[0]?.assignment.id ?? '')?.scorePercent ?? 0,
      timeSpent: '0 min',
    },
    assignedHomework: recipients.map((r) => ({
      homeworkId: r.assignment.id,
      title: r.assignment.title,
      dueDate: r.assignment.dueAt?.toISOString().split('T')[0] ?? 'No due date',
      estimatedTime: '30 min',
      status: r.visibilityStatus === 'completed' ? 'completed'
        : r.visibilityStatus === 'visible' ? 'in-progress'
        : 'pending' as 'pending' | 'in-progress' | 'completed',
    })),
    recentQuizzes: attempts.map((a) => ({
      quizId: a.assignmentId,
      quizName: a.assignment?.title || 'Quiz',
      score: a.scorePercent ?? 0,
      totalQuestions: 10,
      percentage: a.scorePercent ?? 0,
      feedback: (a.scorePercent ?? 0) >= 80 ? 'Excellent work!' : 'Keep practicing!',
      date: a.startedAt.toISOString().split('T')[0],
    })),
    overallMastery,
    streakDays: 3, // Placeholder until engagement tracking is built
    masteryLevels: [], // Built out in Phase 2
    misconceptions: questions.map((q) => ({
      id: q.id,
      topic: q.questionText.split(' ').slice(0, 5).join(' '),
      description: q.questionText.slice(0, 100),
      questionsWrong: 1,
      firstNoticed: q.createdAt.toISOString().split('T')[0],
    })),
    teachingGuidance: {
      recommendedApproach: 'Focus on understanding core concepts before memorization.',
      preferredContentTypes: ['visual', 'text'],
      engagementStrategies: ['Ask questions when confused', 'Review mistakes promptly'],
      pacingRecommendations: 'Take breaks every 25-30 minutes.',
    },
  };
}