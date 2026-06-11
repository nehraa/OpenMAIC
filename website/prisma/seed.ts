import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Default Tenant",
    },
  });
  console.log(`Created tenant: ${tenant.name}`);

  const tenantId = tenant.id;
  const BCRYPT_ROUNDS = 12;

  // Create teacher account
  const teacherPasswordHash = await bcrypt.hash("demo123", BCRYPT_ROUNDS);
  const teacher = await prisma.user.upsert({
    where: { email: "priya.sharma@aidu.tech" },
    update: {},
    create: {
      tenantId,
      role: "teacher",
      phoneE164: "+919876543210",
      name: "Prof. Priya Sharma",
      email: "priya.sharma@aidu.tech",
      passwordHash: teacherPasswordHash,
      status: "active",
    },
  });
  console.log(`Created teacher: ${teacher.email}`);

  // Create class "Class 10 A"
  const classRecord = await prisma.class.upsert({
    where: { joinCode: "SCI10A2026" },
    update: {},
    create: {
      tenantId,
      teacherId: teacher.id,
      name: "Class 10 A",
      subject: "Science",
      batch: "A",
      joinCode: "SCI10A2026",
      peerVisibilityEnabled: false,
    },
  });
  console.log(`Created class: ${classRecord.name} (${classRecord.joinCode})`);

  // Student data matching mock-data.ts
  const studentData = [
    { name: "Arjun Mehta", email: "arjun.mehta@student.edu" },
    { name: "Priya Patel", email: "priya.patel@student.edu" },
    { name: "Rahul Verma", email: "rahul.verma@student.edu" },
    { name: "Ananya Singh", email: "ananya.singh@student.edu" },
    { name: "Vikram Rao", email: "vikram.rao@student.edu" },
    { name: "Kavya Nair", email: "kavya.nair@student.edu" },
    { name: "Aditya Kumar", email: "aditya.kumar@student.edu" },
    { name: "Sneha Gupta", email: "sneha.gupta@student.edu" },
    { name: "Rohit Shah", email: "rohit.shah@student.edu" },
    { name: "Diya Sharma", email: "diya.sharma@student.edu" },
  ];

  const studentPasswordHash = await bcrypt.hash("demo123", BCRYPT_ROUNDS);

  for (let i = 0; i < studentData.length; i++) {
    const data = studentData[i];
    const phoneE164 = `+919876000${String(i + 1).padStart(3, "0")}`;

    const student = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        tenantId,
        role: "student_classroom",
        phoneE164,
        name: data.name,
        email: data.email,
        passwordHash: studentPasswordHash,
        status: "active",
      },
    });
    console.log(`Created student: ${student.email}`);

    // Enroll student in class
    await prisma.classMembership.upsert({
      where: {
        class_memberships_class_id_student_id_key: {
          classId: classRecord.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        tenantId,
        classId: classRecord.id,
        studentId: student.id,
        source: "manual",
      },
    });
    console.log(`Enrolled ${student.email} in ${classRecord.name}`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });