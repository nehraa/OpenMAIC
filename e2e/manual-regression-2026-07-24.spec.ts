import { test, expect } from '@playwright/test';

/**
 * Abhinav 2026-07-24 regression batch.
 * Targets the actual port mapping for this stack:
 *   - parent 3001
 *   - teacher 3002 (basePath /teacher)
 *   - core 3003 (basePath /classroom)
 *   - student 3004 (basePath /student)
 */

const TEST_OTP = '123456';
const TEACHER_PHONE = '+919876543210';
const STUDENT_PHONE = '+919876543220';

const PARENT = 'http://127.0.0.1:3001';
const TEACHER = 'http://127.0.0.1:3002';
const STUDENT = 'http://127.0.0.1:3004';

test.describe.configure({ mode: 'serial' });

async function authedSessionId(request: import('@playwright/test').APIRequestContext, baseURL: string, phone: string) {
  await request.post(`${baseURL}/api/auth/request-otp`, { data: { phone } });
  const verify = await request.post(`${baseURL}/api/auth/verify-otp`, {
    data: { phone, otp: TEST_OTP },
  });
  expect(verify.status(), `verify-otp ${baseURL} ${phone}: ${await verify.text()}`).toBe(200);
  const sid = verify.headers()['x-session-id'];
  expect(sid, 'session_id present').toBeDefined();
  return sid as string;
}

test.describe('Abhinav 2026-07-24 regressions', () => {
  test('1) parent login issues both teacher and student cookies', async ({ request }) => {
    const teacher = await authedSessionId(request, PARENT, TEACHER_PHONE);
    const student = await authedSessionId(request, PARENT, STUDENT_PHONE);
    expect(teacher).toBeTruthy();
    expect(student).toBeTruthy();
  });

  test('2) student classes list returns 200 and single-class returns 200', async ({ request }) => {
    const sid = await authedSessionId(request, PARENT, STUDENT_PHONE);
    const headers = { 'x-session-id': sid };

    const list = await request.get(`${STUDENT}/student/api/student/classes`, { headers });
    expect(list.status(), `list ${await list.text()}`).toBe(200);
    const listJson = (await list.json()) as { classes: Array<{ id: string; name: string }> };
    expect(listJson.classes.length).toBeGreaterThan(0);

    const detail = await request.get(`${STUDENT}/student/api/student/classes/${listJson.classes[0].id}`, { headers });
    expect(detail.status(), `detail ${await detail.text()}`).toBe(200);
  });

  test('3) student assignment detail endpoint + access code returns enabled code', async ({ request }) => {
    const sid = await authedSessionId(request, PARENT, STUDENT_PHONE);
    const headers = { 'x-session-id': sid };

    const assignments = await request.get(`${STUDENT}/student/api/student/assignments`, { headers });
    expect(assignments.status(), `assignments ${await assignments.text()}`).toBe(200);
    const listJson = (await assignments.json()) as { assignments: Array<{ id: string }> };
    expect(listJson.assignments.length).toBeGreaterThan(0);

    const access = await request.get(`${STUDENT}/student/api/student/access-code`, { headers });
    expect(access.status(), `access-code ${await access.text()}`).toBe(200);
    const code = (await access.json()) as { enabled: boolean; code: string };
    expect(code.enabled).toBe(true);
    expect(code.code).toBe('PHYSIO');
  });

  test('4) teacher manage-students detail returns 200 (B2C fix)', async ({ request }) => {
    const sid = await authedSessionId(request, PARENT, TEACHER_PHONE);
    const headers = { 'x-session-id': sid };

    const classes = await request.get(`${TEACHER}/teacher/api/teacher/classes`, { headers });
    expect(classes.status(), `classes ${await classes.text()}`).toBe(200);
    const cls = (await classes.json()) as { classes: Array<{ id: string; name: string }> };
    expect(cls.classes.length).toBeGreaterThan(0);

    const students = await request.get(
      `${TEACHER}/teacher/api/teacher/classes/${cls.classes[0].id}/students`,
      { headers }
    );
    expect(students.status(), `students ${await students.text()}`).toBe(200);
    const studentsJson = (await students.json()) as { students: Array<{ id: string }> };
    expect(studentsJson.students.length).toBeGreaterThan(0);

    const progress = await request.get(
      `${TEACHER}/teacher/api/teacher/progress/student/${studentsJson.students[0].id}?days=30`,
      { headers }
    );
    expect(progress.status(), `progress ${await progress.text()}`).toBe(200);
  });

  test('5) teacher class settings page loads (200)', async ({ request }) => {
    const sid = await authedSessionId(request, PARENT, TEACHER_PHONE);
    const headers = { 'x-session-id': sid };

    const classes = await request.get(`${TEACHER}/teacher/api/teacher/classes`, { headers });
    const cls = (await classes.json()) as { classes: Array<{ id: string }> };
    const classId = cls.classes[0].id;

    const page = await request.get(`${TEACHER}/teacher/teacher/classes/${classId}/settings`, { headers });
    expect(page.status(), `settings page ${await page.text()}`).toBe(200);
  });

  test('6) teacher live sessions page loads (200)', async ({ request }) => {
    const sid = await authedSessionId(request, PARENT, TEACHER_PHONE);
    const page = await request.get(`${TEACHER}/teacher/teacher/sessions`, {
      headers: { 'x-session-id': sid },
    });
    expect(page.status(), `sessions ${await page.text()}`).toBe(200);
  });

  test('7) teacher global settings page loads (200)', async ({ request }) => {
    const sid = await authedSessionId(request, PARENT, TEACHER_PHONE);
    const page = await request.get(`${TEACHER}/teacher/teacher/settings`, {
      headers: { 'x-session-id': sid },
    });
    expect(page.status(), `settings ${await page.text()}`).toBe(200);
  });
});
