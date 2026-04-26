import { test, expect } from '@playwright/test';

const TEST_OTP = '123456';

/**
 * Phase 1 E2E Tests
 * Tests: Auth flow, RBAC, Class management, Session lifecycle, Student join
 */

// Generate unique phone numbers per worker to avoid parallel test pollution
const getTeacherPhone = (workerIndex: number) => `+919876${String(workerIndex).padStart(4, '0')}10`;
const getStudentPhone = (workerIndex: number) => `+919876${String(workerIndex).padStart(4, '0')}11`;

test.describe('Phase 1 Auth Flow', () => {
  test('teacher can request OTP', async ({ page }) => {
    await page.goto('/teacher/login');
    await page.fill('[name=phone]', '+919876543210');
    await page.click('button[type=submit]');
    await expect(page.locator('text=/otp sent|sent|check/i')).toBeVisible({ timeout: 5000 });
  });

  test('teacher can login with valid OTP and reach dashboard', async ({ page }) => {
    await page.goto('/teacher/login');
    await page.fill('[name=phone]', '+919876543210');
    await page.fill('[name=otp]', TEST_OTP);
    await page.click('button[type=submit]');
    await expect(page).toHaveURL(/\/classes/, { timeout: 10000 });
  });

  test('student can request OTP', async ({ page }) => {
    await page.goto('/student/login');
    await page.fill('[name=phone]', '+919876543211');
    await page.click('button[type=submit]');
    await expect(page.locator('text=/otp sent|sent|check/i')).toBeVisible({ timeout: 5000 });
  });

  test('student can login with valid OTP and reach classes page', async ({ page }) => {
    await page.goto('/student/login');
    await page.fill('[name=phone]', '+919876543211');
    await page.fill('[name=otp]', TEST_OTP);
    await page.click('button[type=submit]');
    await expect(page).toHaveURL(/\/classes/, { timeout: 10000 });
  });
});

test.describe('Phase 1 RBAC Enforcement', () => {
  let teacherSession: string;
  let studentSession: string;

  test.beforeAll(async ({ request, workerIndex }) => {
    const teacherPhone = getTeacherPhone(workerIndex);
    const studentPhone = getStudentPhone(workerIndex);

    // Create teacher session
    const teacherReq = await request.post('/teacher/api/auth/request-otp', {
      data: { phone: teacherPhone }
    });
    expect(teacherReq.ok()).toBeTruthy();

    const verifyTeacher = await request.post('/teacher/api/auth/verify-otp', {
      data: { phone: teacherPhone, otp: TEST_OTP }
    });
    expect(verifyTeacher.ok()).toBeTruthy();
    teacherSession = verifyTeacher.headers()['x-session-id'];
    expect(teacherSession).toBeDefined();

    // Create student session
    const studentReq = await request.post('/student/api/auth/request-otp', {
      data: { phone: studentPhone }
    });
    expect(studentReq.ok()).toBeTruthy();

    const verifyStudent = await request.post('/student/api/auth/verify-otp', {
      data: { phone: studentPhone, otp: TEST_OTP }
    });
    expect(verifyStudent.ok()).toBeTruthy();
    studentSession = verifyStudent.headers()['x-session-id'];
    expect(studentSession).toBeDefined();
  });

  test('student cannot access teacher API endpoints', async ({ request }) => {
    const response = await request.get('/teacher/api/teacher/classes', {
      headers: { 'x-session-id': studentSession }
    });
    expect(response.status()).toBe(403);
  });

  test('teacher cannot access student API endpoints', async ({ request }) => {
    const response = await request.get('/student/api/student/classes', {
      headers: { 'x-session-id': teacherSession }
    });
    expect(response.status()).toBe(403);
  });

  test('unauthenticated requests are rejected', async ({ request }) => {
    const response = await request.get('/teacher/api/teacher/classes');
    expect(response.status()).toBe(401);
  });
});

test.describe('Phase 1 Class Management', () => {
  let teacherSession: string;

  test.beforeAll(async ({ request, workerIndex }) => {
    const teacherPhone = getTeacherPhone(workerIndex);
    const verifyTeacher = await request.post('/teacher/api/auth/verify-otp', {
      data: { phone: teacherPhone, otp: TEST_OTP }
    });
    teacherSession = verifyTeacher.headers()['x-session-id'];
    expect(teacherSession).toBeDefined();
  });

  test('teacher can create a class', async ({ request }) => {
    const response = await request.post('/teacher/api/teacher/classes', {
      headers: { 'x-session-id': teacherSession },
      data: { name: 'Test Class', subject: 'Math', batch: '2026' }
    });
    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.class).toHaveProperty('id');
    expect(data.class.name).toBe('Test Class');
  });

  test('teacher can list their classes', async ({ request }) => {
    const response = await request.get('/teacher/api/teacher/classes', {
      headers: { 'x-session-id': teacherSession }
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('classes');
    expect(Array.isArray(data.classes)).toBeTruthy();
  });

  test('teacher can add student by phone', async ({ request, workerIndex }) => {
    const studentPhone = getStudentPhone(workerIndex);

    // First create a class
    const createClass = await request.post('/teacher/api/teacher/classes', {
      headers: { 'x-session-id': teacherSession },
      data: { name: 'Student Test Class', subject: 'Science', batch: '2026' }
    });
    const classData = await createClass.json();
    const classId = classData.class.id;

    // Add student
    const response = await request.post(`/teacher/api/teacher/classes/${classId}/students`, {
      headers: { 'x-session-id': teacherSession },
      data: { phone: studentPhone, name: 'Test Student' }
    });
    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.student).toHaveProperty('id');
    expect(data.student.phone_e164).toBe(studentPhone);
  });
});

test.describe('Phase 1 Session Lifecycle', () => {
  let teacherSession: string;
  let classId: string;

  test.beforeAll(async ({ request, workerIndex }) => {
    const teacherPhone = getTeacherPhone(workerIndex);

    // Get teacher session and create a class for session tests
    const verifyTeacher = await request.post('/teacher/api/auth/verify-otp', {
      data: { phone: teacherPhone, otp: TEST_OTP }
    });
    teacherSession = verifyTeacher.headers()['x-session-id'];
    expect(teacherSession).toBeDefined();

    const createClass = await request.post('/teacher/api/teacher/classes', {
      headers: { 'x-session-id': teacherSession },
      data: { name: 'Session Test Class', subject: 'Physics', batch: '2026' }
    });
    const classData = await createClass.json();
    classId = classData.class.id;
  });

  test('teacher can create a session', async ({ request }) => {
    const response = await request.post(`/teacher/api/teacher/classes/${classId}/sessions`, {
      headers: { 'x-session-id': teacherSession },
      data: { title: 'Test Session', max_duration_minutes: 15 }
    });
    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.session).toHaveProperty('id');
    expect(data.session.status).toBe('draft');
  });

  test('teacher can start a session', async ({ request }) => {
    // Create a session first
    const createSession = await request.post(`/teacher/api/teacher/classes/${classId}/sessions`, {
      headers: { 'x-session-id': teacherSession },
      data: { title: 'Live Test Session' }
    });
    const sessionData = await createSession.json();
    const sessionId = sessionData.session.id;

    // Start the session
    const response = await request.post(`/teacher/api/teacher/sessions/${sessionId}/start`, {
      headers: { 'x-session-id': teacherSession }
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.session.status).toBe('live');
    expect(data.session.started_at).toBeTruthy();
  });

  test('teacher can end a session', async ({ request }) => {
    // Create and start a session first
    const createSession = await request.post(`/teacher/api/teacher/classes/${classId}/sessions`, {
      headers: { 'x-session-id': teacherSession },
      data: { title: 'End Test Session' }
    });
    const sessionData = await createSession.json();
    const sessionId = sessionData.session.id;

    // Start then end
    await request.post(`/teacher/api/teacher/sessions/${sessionId}/start`, {
      headers: { 'x-session-id': teacherSession }
    });

    const response = await request.post(`/teacher/api/teacher/sessions/${sessionId}/end`, {
      headers: { 'x-session-id': teacherSession }
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.session.status).toBe('ended');
    expect(data.session.ended_at).toBeTruthy();
  });

  test('student cannot start/end sessions', async ({ request, workerIndex }) => {
    const studentPhone = getStudentPhone(workerIndex);

    // Create a session as teacher
    const createSession = await request.post(`/teacher/api/teacher/classes/${classId}/sessions`, {
      headers: { 'x-session-id': teacherSession },
      data: { title: 'RBAC Test Session' }
    });
    const sessionData = await createSession.json();
    const sessionId = sessionData.session.id;

    // Try to start as student
    const studentVerify = await request.post('/student/api/auth/verify-otp', {
      data: { phone: studentPhone, otp: TEST_OTP }
    });
    const studentSession = studentVerify.headers()['x-session-id'];

    const startResponse = await request.post(`/teacher/api/teacher/sessions/${sessionId}/start`, {
      headers: { 'x-session-id': studentSession }
    });
    expect(startResponse.status()).toBe(403);
  });
});

test.describe('Phase 1 Student Join Flow', () => {
  let teacherSession: string;
  let classId: string;
  let joinCode: string;

  test.beforeAll(async ({ request, workerIndex }) => {
    const teacherPhone = getTeacherPhone(workerIndex);

    const verifyTeacher = await request.post('/teacher/api/auth/verify-otp', {
      data: { phone: teacherPhone, otp: TEST_OTP }
    });
    teacherSession = verifyTeacher.headers()['x-session-id'];
    expect(teacherSession).toBeDefined();

    const createClass = await request.post('/teacher/api/teacher/classes', {
      headers: { 'x-session-id': teacherSession },
      data: { name: 'Join Test Class', subject: 'Chemistry', batch: '2026' }
    });
    const classData = await createClass.json();
    classId = classData.class.id;
    joinCode = classData.class.join_code;
  });

  test('student can join class with valid code', async ({ request, workerIndex }) => {
    const studentPhone = getStudentPhone(workerIndex);

    // Authenticate as student first
    await request.post('/student/api/auth/request-otp', {
      data: { phone: studentPhone }
    });
    const verifyStudent = await request.post('/student/api/auth/verify-otp', {
      data: { phone: studentPhone, otp: TEST_OTP }
    });
    const studentSession = verifyStudent.headers()['x-session-id'];
    expect(studentSession).toBeDefined();

    const response = await request.post('/student/api/student/join-class', {
      headers: { 'x-session-id': studentSession },
      data: { join_code: joinCode }
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.class).toHaveProperty('id');
    expect(data.membership).toHaveProperty('id');
  });

  test('student cannot join with invalid code', async ({ request, workerIndex }) => {
    const studentPhone = getStudentPhone(workerIndex);

    // Authenticate as student first
    await request.post('/student/api/auth/request-otp', {
      data: { phone: studentPhone }
    });
    const verifyStudent = await request.post('/student/api/auth/verify-otp', {
      data: { phone: studentPhone, otp: TEST_OTP }
    });
    const studentSession = verifyStudent.headers()['x-session-id'];

    const response = await request.post('/student/api/student/join-class', {
      headers: { 'x-session-id': studentSession },
      data: { join_code: 'INVALID1' }
    });
    expect(response.status()).toBe(400);
  });
});

test.describe('Phase 1 Token Usage Tracking', () => {
  test('usage endpoints exist and return valid structure', async ({ request, workerIndex }) => {
    const teacherPhone = getTeacherPhone(workerIndex);

    const verifyTeacher = await request.post('/teacher/api/auth/verify-otp', {
      data: { phone: teacherPhone, otp: TEST_OTP }
    });
    const teacherSession = verifyTeacher.headers()['x-session-id'];
    expect(teacherSession).toBeDefined();

    // Daily usage
    const dailyResponse = await request.get('/teacher/api/teacher/usage/daily', {
      headers: { 'x-session-id': teacherSession }
    });
    expect(dailyResponse.status()).toBe(200);
    const dailyData = await dailyResponse.json();
    expect(dailyData).toHaveProperty('date');
    expect(dailyData).toHaveProperty('total_tokens');
    expect(dailyData).toHaveProperty('total_cost');

    // Weekly usage
    const weeklyResponse = await request.get('/teacher/api/teacher/usage/weekly', {
      headers: { 'x-session-id': teacherSession }
    });
    expect(weeklyResponse.status()).toBe(200);
    const weeklyData = await weeklyResponse.json();
    expect(weeklyData).toHaveProperty('week');
    expect(weeklyData).toHaveProperty('total_tokens');
  });
});
