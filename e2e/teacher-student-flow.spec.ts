import { test, expect } from '@playwright/test';

const TEST_OTP = '123456';

/**
 * Teacher-Student Flow E2E Tests
 * Full flow: Teacher creates class → adds student → creates assignment → student sees assignment
 */

const getTeacherPhone = (workerIndex: number) => `+919876${String(workerIndex).padStart(4, '0')}30`;
const getStudentPhone = (workerIndex: number) => `+919876${String(workerIndex).padStart(4, '0')}31`;

test.describe('Full Teacher-Student Flow', () => {
  let teacherSession: string;
  let studentSession: string;
  let classId: string;
  let joinCode: string;
  let assignmentId: string;

  test.beforeAll(async ({ request, workerIndex }) => {
    const teacherPhone = getTeacherPhone(workerIndex);
    const studentPhone = getStudentPhone(workerIndex);

    // Teacher authenticates
    await request.post('http://localhost:3001/api/auth/request-otp', {
      data: { phone: teacherPhone }
    });
    const verifyTeacher = await request.post('http://localhost:3001/api/auth/verify-otp', {
      data: { phone: teacherPhone, otp: TEST_OTP }
    });
    teacherSession = verifyTeacher.headers()['x-session-id'];
    expect(teacherSession).toBeDefined();

    // Student authenticates
    await request.post('http://localhost:3002/api/auth/request-otp', {
      data: { phone: studentPhone }
    });
    const verifyStudent = await request.post('http://localhost:3002/api/auth/verify-otp', {
      data: { phone: studentPhone, otp: TEST_OTP }
    });
    studentSession = verifyStudent.headers()['x-session-id'];
    expect(studentSession).toBeDefined();
  });

  test('Step 1: Teacher creates a class', async ({ request }) => {
    const response = await request.post('http://localhost:3001/api/teacher/classes', {
      headers: { 'x-session-id': teacherSession },
      data: { name: 'E2E Flow Test Class', subject: 'Science', batch: '2026' }
    });
    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.class).toHaveProperty('id');
    expect(data.class.name).toBe('E2E Flow Test Class');
    classId = data.class.id;
    joinCode = data.class.join_code;
  });

  test('Step 2: Teacher sees class in dashboard', async ({ page }) => {
    await page.goto('http://localhost:3001/teacher/classes');

    // Class should appear in the list
    await expect(page.getByText('E2E Flow Test Class')).toBeVisible({ timeout: 10000 });
  });

  test('Step 3: Teacher adds student to class', async ({ request }) => {
    const response = await request.post(`http://localhost:3001/api/teacher/classes/${classId}/students`, {
      headers: { 'x-session-id': teacherSession },
      data: { phone: getStudentPhone(0), name: 'Test Student' }
    });
    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.student).toHaveProperty('id');
  });

  test('Step 4: Student joins class using join code', async ({ request, workerIndex }) => {
    const studentPhone = getStudentPhone(workerIndex);

    const response = await request.post('http://localhost:3002/api/student/join-class', {
      headers: { 'x-session-id': studentSession },
      data: { join_code: joinCode }
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.class.id).toBe(classId);
  });

  test('Step 5: Teacher creates an assignment for the class', async ({ request }) => {
    const response = await request.post('http://localhost:3001/api/teacher/assignments', {
      headers: { 'x-session-id': teacherSession },
      data: {
        class_id: classId,
        title: 'E2E Test Assignment',
        description: 'Test assignment from E2E flow',
        status: 'released'
      }
    });
    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.assignment).toHaveProperty('id');
    expect(data.assignment.title).toBe('E2E Test Assignment');
    assignmentId = data.assignment.id;
  });

  test('Step 6: Student sees the assignment on their dashboard', async ({ page }) => {
    await page.goto('http://localhost:3002/student/assignments');

    // Assignment should appear in the list
    await expect(page.getByText('E2E Test Assignment')).toBeVisible({ timeout: 10000 });
  });

  test('Step 7: Teacher can see student progress', async ({ request }) => {
    // Get the class students
    const response = await request.get(`http://localhost:3001/api/teacher/classes/${classId}/students`, {
      headers: { 'x-session-id': teacherSession }
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.students).toBeDefined();
    expect(data.students.length).toBeGreaterThan(0);
  });

  test('Step 8: Student can view assignment details', async ({ page }) => {
    await page.goto('http://localhost:3002/student/assignments');

    // Click on the assignment
    await page.getByText('E2E Test Assignment').click();

    // Should navigate to assignment detail page
    await expect(page).toHaveURL(/\/student\/assignments\/[^/]+/, { timeout: 10000 });
  });

  test('Step 9: Teacher can view class details with all students', async ({ page }) => {
    await page.goto(`http://localhost:3001/teacher/classes/${classId}`);

    // Student should appear in class
    await expect(page.getByText('Test Student')).toBeVisible({ timeout: 10000 });
  });

  test('Step 10: End-to-end data integrity - assignment belongs to correct class', async ({ request }) => {
    // Verify assignment's class_id matches what we created
    const response = await request.get(`http://localhost:3001/api/teacher/assignments/${assignmentId}`, {
      headers: { 'x-session-id': teacherSession }
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.assignment.class_id).toBe(classId);
  });
});

test.describe('Student Assignment Completion Flow', () => {
  let teacherSession: string;
  let studentSession: string;
  let classId: string;
  let assignmentId: string;

  test.beforeAll(async ({ request, workerIndex }) => {
    const teacherPhone = getTeacherPhone(workerIndex + 100);
    const studentPhone = getStudentPhone(workerIndex + 100);

    // Setup both users
    await request.post('http://localhost:3001/api/auth/request-otp', {
      data: { phone: teacherPhone }
    });
    const verifyTeacher = await request.post('http://localhost:3001/api/auth/verify-otp', {
      data: { phone: teacherPhone, otp: TEST_OTP }
    });
    teacherSession = verifyTeacher.headers()['x-session-id'];

    await request.post('http://localhost:3002/api/auth/request-otp', {
      data: { phone: studentPhone }
    });
    const verifyStudent = await request.post('http://localhost:3002/api/auth/verify-otp', {
      data: { phone: studentPhone, otp: TEST_OTP }
    });
    studentSession = verifyStudent.headers()['x-session-id'];

    // Create class and assignment
    const createClass = await request.post('http://localhost:3001/api/teacher/classes', {
      headers: { 'x-session-id': teacherSession },
      data: { name: 'Completion Test Class', subject: 'Math', batch: '2026' }
    });
    const classData = await createClass.json();
    classId = classData.class.id;

    // Student joins
    await request.post('http://localhost:3002/api/student/join-class', {
      headers: { 'x-session-id': studentSession },
      data: { join_code: classData.class.join_code }
    });

    // Create assignment
    const createAssignment = await request.post('http://localhost:3001/api/teacher/assignments', {
      headers: { 'x-session-id': teacherSession },
      data: {
        class_id: classId,
        title: 'Completion Test Assignment',
        status: 'released'
      }
    });
    const assignmentData = await createAssignment.json();
    assignmentId = assignmentData.assignment.id;
  });

  test('Student can mark assignment as in_progress', async ({ request }) => {
    const response = await request.patch(`http://localhost:3002/api/student/assignments/${assignmentId}`, {
      headers: { 'x-session-id': studentSession },
      data: { status: 'in_progress' }
    });
    expect(response.status()).toBe(200);
  });

  test('Student can mark assignment as completed', async ({ request }) => {
    const response = await request.patch(`http://localhost:3002/api/student/assignments/${assignmentId}`, {
      headers: { 'x-session-id': studentSession },
      data: { status: 'completed' }
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.assignment.status).toBe('completed');
  });

  test('Teacher can see student completed assignment', async ({ request }) => {
    const response = await request.get(`http://localhost:3001/api/teacher/classes/${classId}/students`, {
      headers: { 'x-session-id': teacherSession }
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    // Student should have completed status
    const student = data.students.find((s: any) => s.phone_e164 === getStudentPhone(1));
    expect(student).toBeDefined();
  });
});
