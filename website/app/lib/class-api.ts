import { prisma } from './prisma';
import { getSession } from './auth';

export async function joinClassByCode(joinCode: string) {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT_CLASSROOM') {
    throw new Error('UNAUTHORIZED');
  }

  const cls = await prisma.class.findUnique({
    where: { joinCode: joinCode.toUpperCase() },
    include: { teacher: true },
  });

  if (!cls) {
    throw new Error('CLASS_NOT_FOUND');
  }

  const existing = await prisma.classMembership.findUnique({
    where: { class_memberships_class_id_student_id_key: { classId: cls.id, studentId: session.userId } },
  });

  if (existing) {
    throw new Error('ALREADY_MEMBER');
  }

  const membership = await prisma.classMembership.create({
    data: {
      tenantId: session.tenantId,
      classId: cls.id,
      studentId: session.userId,
      source: 'manual',
    },
  });

  return { class: cls, membership };
}

export async function getStudentClasses() {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT_CLASSROOM') {
    throw new Error('UNAUTHORIZED');
  }

  const memberships = await prisma.classMembership.findMany({
    where: { studentId: session.userId },
    include: {
      class: {
        include: { teacher: true },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  });

  return memberships.map((m) => ({
    id: m.class.id,
    name: m.class.name,
    subject: m.class.subject,
    teacherName: m.class.teacher.name,
    joinCode: m.class.joinCode,
    enrolledAt: m.enrolledAt,
  }));
}