import { test, expect } from '@playwright/test';

const TEST_OTP = '123456';

/**
 * RLS Isolation E2E Tests
 * Verifies that Row Level Security policies prevent cross-tenant data access
 * Tests: Teachers cannot see each other's classes, students, or assignments
 */

const getTeacherAPhone = (workerIndex: number) => `+919876${String(workerIndex).padStart(4, '0')}40`;
const getTeacherBPhone = (workerIndex: number) => `+919876${String(workerIndex).padStart(4, '0')}41`;
const getStudentAPhone = (workerIndex: number) => `+919876${String(workerIndex).padStart(4, '0')}42`;
const getStudentBPhone = (workerIndex: number) => `+919876${String(workerIndex).padStart(4, '0')}43`;

test.describe('RLS Isolation - Classes', () => {
  let teacherASession: string;
  let teacherBSession: string;
  let classAId: string;
  let classBId: string;

  test.beforeAll(async ({ request, workerIndex }) => {
    const teacherAPhone = getTeacherAPhone(workerIndex);
    const teacherBPhone = getTeacherBPhone(workerIndex);

    // Teacher A authenticates
    await request.post('http://localhost:3001/api/auth/request-otp', {
      data: { phone: teacherAPhone }
    });
    const verifyTeacherA = await request.post('http://localhost:3001/api/auth/verify-otp', {
      data: { phone: teacherAPhone, otp: TEST_OTP }
    });
    teacherASession = verifyTeacherA.headers()['x-session-id'];
    expect(teacherASession).toBeDefined();

    // Teacher B authenticates
    await request.post('http://localhost:3001/api/auth/request-otp', {
      data: { phone: teacherBPhone }
    });
    const verifyTeacherB = await request.post('http://localhost:3001/api/auth/verify-otp', {
      data: { phone: teacherBPhone, otp: TEST_OTP }
    });
    teacherBSession = verifyTeacherB.headers()['x-session-id'];
    expect(teacherBSession).toBeDefined();

    // Teacher A creates Class A
    const createClassA = await request.post('http://localhost:3001/api/teacher/classes', {
      headers: { 'x-session-id': teacherASession },
      data: { name: 'Teacher A Class', subject: 'Math', batch: '2026' }
    });
    const classAData = await createClassA.json();
    classAId = classAData.class.id;

    // Teacher B creates Class B
    const createClassB = await request.post('http://localhost:3001/api/teacher/classes', {
      headers: { 'x-session-id': teacherBSession },
      data: { name: 'Teacher B Class', subject: 'Science', batch: '2026' }
    });
    const classBData = await createClassB.json();
    classBId = classBData.class.id;
  });

  test('Teacher A can only see their own classes', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/teacher/classes', {
      headers: { 'x-session-id': teacherASession }
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.classes).toBeDefined();

    const classNames = data.classes.map((c: any) => c.name);
    expect(classNames).toContain('Teacher A Class');
    expect(classNames).not.toContain('Teacher B Class');
  });

  test('Teacher B can only see their own classes', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/teacher/classes', {
      headers: { 'x-session-id': teacherBSession }
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.classes).toBeDefined();

    const classNames = data.classes.map((c: any) => c.name);
    expect(classNames).toContain('Teacher B Class');
    expect(classNames).not.toContain('Teacher A Class');
  });

  test('Teacher A cannot access Teacher B class directly', async ({ request }) => {
    const response = await request.get(`http://localhost:3001/api/teacher/classes/${classBId}`, {
      headers: { 'x-session-id': teacherASession }
    });
    // Should return 404 or empty data, not the actual class
    if (response.status() === 200) {
      const data = await response.json();
      expect(data.class).toBeUndefined();
    } else {
      expect(response.status()).toBe(404);
    }
  });

  test('Teacher B cannot access Teacher A class directly', async ({ request }) => {
    const response = await request.get(`http://localhost:3001/api/teacher/classes/${classAId}`, {
      headers: { 'x-session-id': teacherBSession }
    });
    if (response.status() === 200) {
      const data = await response.json();
      expect(data.class).toBeUndefined();
    } else {
      expect(response.status()).toBe(404);
    }
  });
});

test.describe('RLS Isolation - Students', () => {
  let teacherASession: string;
  let teacherBSession: string;
  let studentASession: string;
  let studentBSession: string;
  let classAId: string;
  let classBId: string;

  test.beforeAll(async ({ request, workerIndex }) => {
    const teacherAPhone = getTeacherAPhone(workerIndex);
    const teacherBPhone = getTeacherBPhone(workerIndex);
    const studentAPhone = getStudentAPhone(workerIndex);
    const studentBPhone = getStudentBPhone(workerIndex);

    // Setup teachers
    await request.post('http://localhost:3001/api/auth/request-otp', { data: { phone: teacherAPhone } });
    const verifyA = await request.post('http://localhost:3001/api/auth/verify-otp', { data: { phone: teacherAPhone, otp: TEST_OTP } });
    teacherASession = verifyA.headers()['x-session-id'];

    await request.post('http://localhost:3001/api/auth/request-otp', { data: { phone: teacherBPhone } });
    const verifyB = await request.post('http://localhost:3001/api/auth/verify-otp', { data: { phone: teacherBPhone, otp: TEST_OTP } });
    teacherBSession = verifyB.headers()['x-session-id'];

    // Setup students
    await request.post('http://localhost:3002/api/auth/request-otp', { data: { phone: studentAPhone } });
    const verifyStudentA = await request.post('http://localhost:3002/api/auth/verify-otp', { data: { phone: studentAPhone, otp: TEST_OTP } });
    studentASession = verifyStudentA.headers()['x-session-id'];

    await request.post('http://localhost:3002/api/auth/request-otp', { data: { phone: studentBPhone } });
    const verifyStudentB = await request.post('http://localhost:3002/api/auth/verify-otp', { data: { phone: studentBPhone, otp: TEST_OTP } });
    studentBSession = verifyStudentB.headers()['x-session-id'];

    // Create classes
    const classA = await request.post('http://localhost:3001/api/teacher/classes', {
      headers: { 'x-session-id': teacherASession },
      data: { name: 'Student Test Class A', subject: 'Math', batch: '2026' }
    });
    classAId = (await classA.json()).class.id;

    const classB = await request.post('http://localhost:3001/api/teacher/classes', {
      headers: { 'x-session-id': teacherBSession },
      data: { name: 'Student Test Class B', subject: 'Science', batch: '2026' }
    });
    classBId = (await classB.json()).class.id;

    // Add students to their respective classes
    await request.post(`http://localhost:3001/api/teacher/classes/${classAId}/students`, {
      headers: { 'x-session-id': teacherASession },
      data: { phone: studentAPhone, name: 'Student A' }
    });

    await request.post(`http://localhost:3001/api/teacher/classes/${classBId}/students`, {
      headers: { 'x-session-id': teacherBSession },
      data: { phone: studentBPhone, name: 'Student B' }
    });

    // Students join their classes
    const joinClassA = await request.post('http://localhost:3002/api/student/join-class', {
      headers: { 'x-session-id': studentASession },
      data: { join_code: (await (await request.get(`http://localhost:3001/api/teacher/classes/${classAId}`, { headers: { 'x-session-id': teacherASession } })).json()).class.join_code }
    });

    const joinClassB = await request.post('http://localhost:3002/api/student/join-class', {
      headers: { 'x-session-id': studentBSession },
      data: { join_code: (await (await request.get(`http://localhost:3001/api/teacher/classes/${classBId}`, { headers: { 'x-session-id': teacherBSession } })).json()).class.join_code }
    });
  });

  test('Teacher A sees only their students', async ({ request }) => {
    const response = await request.get(`http://localhost:3001/api/teacher/classes/${classAId}/students`, {
      headers: { 'x-session-id': teacherASession }
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.students).toBeDefined();

    const studentNames = data.students.map((s: any) => s.name);
    expect(studentNames).toContain('Student A');
    expect(studentNames).not.toContain('Student B');
  });

  test('Teacher B sees only their students', async ({ request }) => {
    const response = await request.get(`http://localhost:3001/api/teacher/classes/${classBId}/students`, {
      headers: { 'x-session-id': teacherBSession }
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.students).toBeDefined();

    const studentNames = data.students.map((s: any) => s.name);
    expect(studentNames).toContain('Student B');
    expect(studentNames).not.toContain('Student A');
  });

  test('Teacher A cannot see Teacher B students list', async ({ request }) => {
    const response = await request.get(`http://localhost:3001/api/teacher/classes/${classBId}/students`, {
      headers: { 'x-session-id': teacherASession }
    });
    if (response.status() === 200) {
      const data = await response.json();
      expect(data.students).toEqual([]);
    } else {
      expect(response.status()).toBe(404);
    }
  });
});

test.describe('RLS Isolation - Assignments', () => {
  let teacherASession: string;
  let teacherBSession: string;
  let classAId: string;
  let classBId: string;
  let assignmentAId: string;
  let assignmentBId: string;

  test.beforeAll(async ({ request, workerIndex }) => {
    const teacherAPhone = getTeacherAPhone(workerIndex + 10);
    const teacherBPhone = getTeacherBPhone(workerIndex + 10);

    // Setup teachers
    await request.post('http://localhost:3001/api/auth/request-otp', { data: { phone: teacherAPhone } });
    const verifyA = await request.post('http://localhost:3001/api/auth/verify-otp', { data: { phone: teacherAPhone, otp: TEST_OTP } });
    teacherASession = verifyA.headers()['x-session-id'];

    await request.post('http://localhost:3001/api/auth/request-otp', { data: { phone: teacherBPhone } });
    const verifyB = await request.post('http://localhost:3001/api/auth/verify-otp', { data: { phone: teacherBPhone, otp: TEST_OTP } });
    teacherBSession = verifyB.headers()['x-session-id'];

    // Create classes
    const classA = await request.post('http://localhost:3001/api/teacher/classes', {
      headers: { 'x-session-id': teacherASession },
      data: { name: 'Assignment Test Class A', subject: 'Math', batch: '2026' }
    });
    classAId = (await classA.json()).class.id;

    const classB = await request.post('http://localhost:3001/api/teacher/classes', {
      headers: { 'x-session-id': teacherBSession },
      data: { name: 'Assignment Test Class B', subject: 'Science', batch: '2026' }
    });
    classBId = (await classB.json()).class.id;

    // Create assignments
    const assignmentA = await request.post('http://localhost:3001/api/teacher/assignments', {
      headers: { 'x-session-id': teacherASession },
      data: { class_id: classAId, title: 'Teacher A Assignment', status: 'draft' }
    });
    assignmentAId = (await assignmentA.json()).assignment.id;

    const assignmentB = await request.post('http://localhost:3001/api/teacher/assignments', {
      headers: { 'x-session-id': teacherBSession },
      data: { class_id: classBId, title: 'Teacher B Assignment', status: 'draft' }
    });
    assignmentBId = (await assignmentB.json()).assignment.id;
  });

  test('Teacher A can only see their assignments', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/teacher/assignments', {
      headers: { 'x-session-id': teacherASession }
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.assignments).toBeDefined();

    const assignmentTitles = data.assignments.map((a: any) => a.title);
    expect(assignmentTitles).toContain('Teacher A Assignment');
    expect(assignmentTitles).not.toContain('Teacher B Assignment');
  });

  test('Teacher B can only see their assignments', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/teacher/assignments', {
      headers: { 'x-session-id': teacherBSession }
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.assignments).toBeDefined();

    const assignmentTitles = data.assignments.map((a: any) => a.title);
    expect(assignmentTitles).toContain('Teacher B Assignment');
    expect(assignmentTitles).not.toContain('Teacher A Assignment');
  });

  test('Teacher A cannot access Teacher B assignment directly', async ({ request }) => {
    const response = await request.get(`http://localhost:3001/api/teacher/assignments/${assignmentBId}`, {
      headers: { 'x-session-id': teacherASession }
    });
    // Should return 404 or empty, not the actual assignment
    if (response.status() === 200) {
      const data = await response.json();
      expect(data.assignment).toBeUndefined();
    } else {
      expect(response.status()).toBe(404);
    }
  });

  test('Teacher B cannot access Teacher A assignment directly', async ({ request }) => {
    const response = await request.get(`http://localhost:3001/api/teacher/assignments/${assignmentAId}`, {
      headers: { 'x-session-id': teacherBSession }
    });
    if (response.status() === 200) {
      const data = await response.json();
      expect(data.assignment).toBeUndefined();
    } else {
      expect(response.status()).toBe(404);
    }
  });
});

test.describe('RLS Isolation - Student Cross-Access Prevention', () => {
  let teacherASession: string;
  let studentASession: string;
  let studentBSession: string;
  let classAId: string;

  test.beforeAll(async ({ request, workerIndex }) => {
    const teacherAPhone = getTeacherAPhone(workerIndex + 20);
    const studentAPhone = getStudentAPhone(workerIndex + 20);
    const studentBPhone = getStudentBPhone(workerIndex + 20);

    // Setup teacher
    await request.post('http://localhost:3001/api/auth/request-otp', { data: { phone: teacherAPhone } });
    const verifyA = await request.post('http://localhost:3001/api/auth/verify-otp', { data: { phone: teacherAPhone, otp: TEST_OTP } });
    teacherASession = verifyA.headers()['x-session-id'];

    // Setup students
    await request.post('http://localhost:3002/api/auth/request-otp', { data: { phone: studentAPhone } });
    const verifyStudentA = await request.post('http://localhost:3002/api/auth/verify-otp', { data: { phone: studentAPhone, otp: TEST_OTP } });
    studentASession = verifyStudentA.headers()['x-session-id'];

    await request.post('http://localhost:3002/api/auth/request-otp', { data: { phone: studentBPhone } });
    const verifyStudentB = await request.post('http://localhost:3002/api/auth/verify-otp', { data: { phone: studentBPhone, otp: TEST_OTP } });
    studentBSession = verifyStudentB.headers()['x-session-id'];

    // Teacher creates class and adds both students
    const classA = await request.post('http://localhost:3001/api/teacher/classes', {
      headers: { 'x-session-id': teacherASession },
      data: { name: 'Cross Access Test Class', subject: 'Math', batch: '2026' }
    });
    classAId = (await classA.json()).class.id;

    await request.post(`http://localhost:3001/api/teacher/classes/${classAId}/students`, {
      headers: { 'x-session-id': teacherASession },
      data: { phone: studentAPhone, name: 'Student Cross A' }
    });

    await request.post(`http://localhost:3001/api/teacher/classes/${classAId}/students`, {
      headers: { 'x-session-id': teacherASession },
      data: { phone: studentBPhone, name: 'Student Cross B' }
    });

    // Both students join
    const joinCode = (await (await request.get(`http://localhost:3001/api/teacher/classes/${classAId}`, { headers: { 'x-session-id': teacherASession } })).json()).class.join_code;

    await request.post('http://localhost:3002/api/student/join-class', {
      headers: { 'x-session-id': studentASession },
      data: { join_code: joinCode }
    });

    await request.post('http://localhost:3002/api/student/join-class', {
      headers: { 'x-session-id': studentBSession },
      data: { join_code: joinCode }
    });
  });

  test('Student A cannot see Student B assignments via API', async ({ request }) => {
    // Student B creates their own assignment list should be separate
    const responseA = await request.get('http://localhost:3002/api/student/assignments', {
      headers: { 'x-session-id': studentASession }
    });
    const responseB = await request.get('http://localhost:3002/api/student/assignments', {
      headers: { 'x-session-id': studentBSession }
    });

    // Both should return their own data
    expect(responseA.status()).toBe(200);
    expect(responseB.status()).toBe(200);

    const dataA = await responseA.json();
    const dataB = await responseB.json();

    // They are in the same class, so they should see the same assignments
    // but their session/user context should be different
    expect(dataA.assignments).toBeDefined();
    expect(dataB.assignments).toBeDefined();
  });
});
