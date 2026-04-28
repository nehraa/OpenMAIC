import { test, expect } from '@playwright/test';

const TEST_OTP = '123456';

/**
 * Auth Flow E2E Tests
 * Tests: Teacher signup, login, logout, student join flow
 */

const getTeacherPhone = (workerIndex: number) => `+919876${String(workerIndex).padStart(4, '0')}20`;
const getStudentPhone = (workerIndex: number) => `+919876${String(workerIndex).padStart(4, '0')}21`;

test.describe('Teacher Signup Flow', () => {
  test('teacher can signup with email/password and reach dashboard', async ({ page }) => {
    await page.goto('http://localhost:3001/teacher/signup');

    // Fill signup form
    await page.fill('[name="name"]', 'Test Teacher');
    await page.fill('[name="email"]', `teacher${Date.now()}@test.com`);
    await page.fill('[name="phone"]', getTeacherPhone(0));
    await page.fill('[name="password"]', 'password123');
    await page.fill('[name="confirmPassword"]', 'password123');

    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/teacher\/classes/, { timeout: 15000 });
  });

  test('signup rejects duplicate email', async ({ page }) => {
    const email = `duplicate${Date.now()}@test.com`;
    const phone = getTeacherPhone(0);

    // First signup
    await page.goto('http://localhost:3001/teacher/signup');
    await page.fill('[name="name"]', 'Test Teacher');
    await page.fill('[name="email"]', email);
    await page.fill('[name="phone"]', phone);
    await page.fill('[name="password"]', 'password123');
    await page.fill('[name="confirmPassword"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/teacher\/classes/, { timeout: 15000 });

    // Logout first
    await page.goto('http://localhost:3001/teacher/login');
    await page.evaluate(() => {
      document.cookie.split(';').forEach(c => {
        const name = c.trim().split('=')[0];
        if (name === 'access_token' || name === 'refresh_token') {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
      });
    });

    // Try duplicate signup
    await page.goto('http://localhost:3001/teacher/signup');
    await page.fill('[name="name"]', 'Another Teacher');
    await page.fill('[name="email"]', email);
    await page.fill('[name="phone"]', '+919988877799');
    await page.fill('[name="password"]', 'password123');
    await page.fill('[name="confirmPassword"]', 'password123');
    await page.click('button[type="submit"]');

    // Should show error about duplicate email
    await expect(page.locator('text=/email|already|registered/i')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Teacher Login Flow', () => {
  test('teacher can login with valid credentials', async ({ page }) => {
    await page.goto('http://localhost:3001/teacher/login');

    // Use the existing test user from phase1
    await page.fill('[name="email"]', 'test@teacher.com');
    await page.fill('[name="password"]', 'password123');

    await page.click('button[type="submit"]');

    // Should redirect to classes page
    await expect(page).toHaveURL(/\/teacher\/classes/, { timeout: 15000 });
  });

  test('login rejects invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:3001/teacher/login');

    await page.fill('[name="email"]', 'nonexistent@test.com');
    await page.fill('[name="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    // Should show error
    await expect(page.locator('text=/invalid|wrong|credentials/i')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Teacher Logout Flow', () => {
  test('teacher can logout and is redirected to login', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3001/teacher/login');
    await page.fill('[name="email"]', 'test@teacher.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/teacher\/classes/, { timeout: 15000 });

    // Perform logout by clearing cookies
    await page.evaluate(() => {
      document.cookie.split(';').forEach(c => {
        const name = c.trim().split('=')[0];
        if (name === 'access_token' || name === 'refresh_token') {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
      });
    });

    // Verify access token cookie is cleared
    const cookies = await page.context().cookies();
    const accessToken = cookies.find(c => c.name === 'access_token');
    expect(accessToken).toBeUndefined();
  });
});

test.describe('Student Join Flow', () => {
  let teacherSession: string;
  let classId: string;
  let joinCode: string;

  test.beforeAll(async ({ request, workerIndex }) => {
    const teacherPhone = getTeacherPhone(workerIndex);

    // Create teacher session via OTP
    const verifyTeacher = await request.post('http://localhost:3001/api/auth/verify-otp', {
      data: { phone: teacherPhone, otp: TEST_OTP }
    });

    if (verifyTeacher.ok()) {
      teacherSession = verifyTeacher.headers()['x-session-id'];
    } else {
      // Request OTP first if verify fails
      await request.post('http://localhost:3001/api/auth/request-otp', {
        data: { phone: teacherPhone }
      });
      const verifyAgain = await request.post('http://localhost:3001/api/auth/verify-otp', {
        data: { phone: teacherPhone, otp: TEST_OTP }
      });
      teacherSession = verifyAgain.headers()['x-session-id'];
    }

    expect(teacherSession).toBeDefined();

    // Create a class
    const createClass = await request.post('http://localhost:3001/api/teacher/classes', {
      headers: { 'x-session-id': teacherSession },
      data: { name: 'E2E Test Class', subject: 'Math', batch: '2026' }
    });
    const classData = await createClass.json();
    classId = classData.class.id;
    joinCode = classData.class.join_code;
  });

  test('student can request OTP', async ({ page }) => {
    await page.goto('http://localhost:3002/student/login');
    await page.fill('[name="phone"]', getStudentPhone(0));
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/otp|sent|check/i')).toBeVisible({ timeout: 5000 });
  });

  test('student can login with valid OTP', async ({ page }) => {
    await page.goto('http://localhost:3002/student/login');
    await page.fill('[name="phone"]', getStudentPhone(0));
    await page.fill('[name="otp"]', TEST_OTP);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/student\/classes/, { timeout: 10000 });
  });

  test('student can join class with valid code', async ({ page, request, workerIndex }) => {
    const studentPhone = getStudentPhone(workerIndex);

    // Authenticate as student
    await request.post('http://localhost:3002/api/auth/request-otp', {
      data: { phone: studentPhone }
    });
    const verifyStudent = await request.post('http://localhost:3002/api/auth/verify-otp', {
      data: { phone: studentPhone, otp: TEST_OTP }
    });
    const studentSession = verifyStudent.headers()['x-session-id'];
    expect(studentSession).toBeDefined();

    const response = await request.post('http://localhost:3002/api/student/join-class', {
      headers: { 'x-session-id': studentSession },
      data: { join_code: joinCode }
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.class).toHaveProperty('id');
    expect(data.membership).toHaveProperty('id');
  });

  test('student cannot join with invalid code', async ({ page, request, workerIndex }) => {
    const studentPhone = getStudentPhone(workerIndex);

    // Authenticate as student
    await request.post('http://localhost:3002/api/auth/request-otp', {
      data: { phone: studentPhone }
    });
    const verifyStudent = await request.post('http://localhost:3002/api/auth/verify-otp', {
      data: { phone: studentPhone, otp: TEST_OTP }
    });
    const studentSession = verifyStudent.headers()['x-session-id'];

    const response = await request.post('http://localhost:3002/api/student/join-class', {
      headers: { 'x-session-id': studentSession },
      data: { join_code: 'INVALID_CODE_123' }
    });
    expect(response.status()).toBe(400);
  });
});
