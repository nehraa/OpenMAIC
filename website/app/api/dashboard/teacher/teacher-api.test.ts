import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/app/lib/prisma";

describe("Prisma Connection", () => {
  beforeAll(async () => {
    // Verify the Prisma client can connect to the database
    await prisma.$connect();
  });

  it("should connect to the database successfully", async () => {
    // Query the tenants table to verify connection
    const result = await prisma.$queryRaw<[{ exists: boolean }]>`
      SELECT true as exists
    `;
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].exists).toBe(true);
  });

  it("should be able to query tenants table", async () => {
    const tenants = await prisma.tenant.findMany();
    expect(tenants).toBeDefined();
    expect(Array.isArray(tenants)).toBe(true);
  });

  it("should be able to query users table", async () => {
    const users = await prisma.user.findMany();
    expect(users).toBeDefined();
    expect(Array.isArray(users)).toBe(true);
  });

  it("should find the demo teacher account", async () => {
    const teacher = await prisma.user.findUnique({
      where: { email: "priya.sharma@aidu.tech" },
    });
    expect(teacher).not.toBeNull();
    expect(teacher?.role).toBe("teacher");
    expect(teacher?.name).toBe("Prof. Priya Sharma");
  });

  it("should find all demo student accounts", async () => {
    const students = await prisma.user.findMany({
      where: { role: "student_classroom" },
    });
    expect(students).toBeDefined();
    expect(students.length).toBeGreaterThanOrEqual(10);
  });

  it("should find the demo class", async () => {
    const classRecord = await prisma.class.findUnique({
      where: { joinCode: "SCI10A2026" },
    });
    expect(classRecord).not.toBeNull();
    expect(classRecord?.name).toBe("Class 10 A");
    expect(classRecord?.subject).toBe("Science");
  });
});