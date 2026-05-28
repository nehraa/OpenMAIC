import { prisma } from './prisma';
import { getSession } from './auth';

export async function createAssignment(data: {
  title: string;
  description: string;
  classId: string;
  dueAt?: Date;
  slideAssetVersionId?: string;
  quizAssetVersionId?: string;
}) {
  const session = await getSession();
  if (!session || session.role !== 'TEACHER') {
    throw new Error('UNAUTHORIZED');
  }

  // Verify teacher owns this class
  const cls = await prisma.class.findFirst({
    where: { id: data.classId, teacherId: session.userId },
  });
  if (!cls) {
    throw new Error('CLASS_NOT_FOUND');
  }

  const assignment = await prisma.assignment.create({
    data: {
      tenantId: session.tenantId,
      classId: data.classId,
      teacherId: session.userId,
      title: data.title,
      description: data.description,
      dueAt: data.dueAt,
      slideAssetVersionId: data.slideAssetVersionId,
      quizAssetVersionId: data.quizAssetVersionId,
      status: 'released',
    },
  });

  // Auto-assign to all students in the class
  const memberships = await prisma.classMembership.findMany({
    where: { classId: data.classId },
  });

  if (memberships.length > 0) {
    await prisma.assignmentRecipient.createMany({
      data: memberships.map((m) => ({
        tenantId: session.tenantId,
        assignmentId: assignment.id,
        studentId: m.studentId,
        visibilityStatus: 'visible',
      })),
    });
  }

  return assignment;
}

export async function getTeacherAssignments() {
  const session = await getSession();
  if (!session || session.role !== 'TEACHER') {
    throw new Error('UNAUTHORIZED');
  }

  return prisma.assignment.findMany({
    where: { teacherId: session.userId },
    include: {
      recipients: { include: { student: true } },
      class: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAssignmentById(id: string) {
  const session = await getSession();
  if (!session || session.role !== 'TEACHER') {
    throw new Error('UNAUTHORIZED');
  }

  const assignment = await prisma.assignment.findFirst({
    where: { id, teacherId: session.userId },
    include: { recipients: { include: { student: true } }, class: true },
  });

  if (!assignment) {
    throw new Error('NOT_FOUND');
  }

  return assignment;
}

export async function updateAssignment(
  id: string,
  data: {
    title?: string;
    description?: string;
    dueAt?: Date;
    status?: 'draft' | 'scheduled' | 'released' | 'closed';
  }
) {
  const session = await getSession();
  if (!session || session.role !== 'TEACHER') {
    throw new Error('UNAUTHORIZED');
  }

  // Verify assignment belongs to this teacher
  const existing = await prisma.assignment.findFirst({
    where: { id, teacherId: session.userId },
  });
  if (!existing) {
    throw new Error('NOT_FOUND');
  }

  return prisma.assignment.update({
    where: { id },
    data,
  });
}