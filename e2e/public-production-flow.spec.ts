import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const PORTAL = 'https://openmaic.devstudios.me';
const TEACHER = 'https://teach.devstudios.me';
const STUDENT = 'https://study.devstudios.me';
const TEACHER_EMAIL = process.env.OPENMAIC_E2E_TEACHER_EMAIL || 'teacher@aidutech.dev';
const TEACHER_PASSWORD = process.env.OPENMAIC_E2E_TEACHER_PASSWORD || 'pangea123';

async function loginTeacher(page: Page) {
  await page.goto(`${PORTAL}/login/teacher`, { waitUntil: 'load' });
  await page.getByRole('textbox', { name: 'Email Address' }).fill(TEACHER_EMAIL);
  await page.getByRole('textbox', { name: 'Password' }).fill(TEACHER_PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(url => /^https:\/\/teach\.devstudios\.me\/teacher\/?$/.test(url.href));
  await expect(page.getByRole('heading', { name: 'Teacher Dashboard' })).toBeVisible();
}

test.describe.serial('OpenMAIC public production flow', () => {
  test('teacher SSO, classroom generation, persistence, and preview', async ({ page }) => {
    test.skip(process.env.OPENMAIC_E2E_GENERATE !== '1', 'Set OPENMAIC_E2E_GENERATE=1 for the paid/long generation smoke test');
    test.setTimeout(300_000);

    await loginTeacher(page);
    const assetsLoaded = page.waitForResponse(
      response => response.url().includes('/teacher/api/teacher/library/assets') && response.ok(),
      { timeout: 30_000 },
    );
    await page.goto(`${TEACHER}/teacher/teacher/library`);
    await assetsLoaded;
    await expect(page.getByRole('heading', { name: 'Content Library' })).toBeVisible();

    const prompt = `Automated public E2E ${Date.now()}: explain gravity to grade 5 in exactly 1 concise scene`;
    const expectedTitle = prompt.length > 50 ? `${prompt.substring(0, 47)}...` : prompt;

    await page.getByRole('button', { name: 'Generate OpenMAIC Classroom' }).click();
    const dialog = page.getByRole('dialog', { name: 'Generate OpenMAIC Classroom' });
    await dialog.getByRole('textbox', { name: 'e.g., Photosynthesis for 8th graders' }).fill(prompt);

    const kickoffResponsePromise = page.waitForResponse(
      response => response.url().endsWith('/teacher/api/teacher/library/generate-classroom')
        && response.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await dialog.getByRole('button', { name: 'Generate Classroom', exact: true }).click();
    const kickoffResponse = await kickoffResponsePromise;
    expect(kickoffResponse.status()).toBe(202);
    const kickoff = (await kickoffResponse.json()) as { jobId?: string };
    expect(kickoff.jobId).toMatch(/^[a-f0-9]{24}$/);

    const statusUrl = `/teacher/api/teacher/library/generate-classroom-status/${kickoff.jobId}`;
    await expect.poll(async () => page.evaluate(async (url) => {
      const response = await fetch(url, { credentials: 'include' });
      const body = await response.json();
      if (!response.ok) throw new Error(`Generation status failed: ${response.status} ${JSON.stringify(body)}`);
      return body.status;
    }, statusUrl), {
      timeout: 240_000,
      intervals: [3_000],
      message: `OpenMAIC classroom generation job ${kickoff.jobId} did not complete`,
    }).toBe('completed');

    // Assert the asset created by this exact job. A count-based assertion is
    // racy when another durable Core job completes while this test is running.
    const heading = page.getByRole('heading', { name: expectedTitle, exact: true });
    await expect(heading).toBeVisible({ timeout: 30_000 });
    const card = heading.locator(
      'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " border ")][1]',
    );
    const classroomLink = card.getByRole('link', { name: 'Enter Classroom' });
    await expect(classroomLink).toHaveAttribute(
      'href',
      /^https:\/\/openmaic\.devstudios\.me\/classroom\/[A-Za-z0-9_-]+$/,
    );

    await card.getByRole('button', { name: 'Preview Slides' }).click();
    await expect(page.getByRole('dialog').getByText('1 slide', { exact: true })).toBeVisible({ timeout: 30_000 });
  });

  test('teacher assignment release to late-joining student through cross-domain SSO', async ({ browser }) => {
    test.setTimeout(180_000);
    const suffix = Date.now();
    const className = `Public E2E Class ${suffix}`;
    const assignmentTitle = `Public E2E Assignment ${suffix}`;

    const teacherContext = await browser.newContext();
    const teacher = await teacherContext.newPage();
    await loginTeacher(teacher);

    const setup = await teacher.evaluate(async ({ className, assignmentTitle }) => {
      const createClassResponse = await fetch('/teacher/api/teacher/classes', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: className, subject: 'Science', batch: 'E2E' }),
      });
      if (!createClassResponse.ok) throw new Error(`Create class failed: ${createClassResponse.status} ${await createClassResponse.text()}`);
      const createdClass = (await createClassResponse.json()).class;

      const assetsResponse = await fetch('/teacher/api/teacher/library/assets', { credentials: 'include' });
      if (!assetsResponse.ok) throw new Error(`List assets failed: ${assetsResponse.status}`);
      const assets = (await assetsResponse.json()).assets;
      if (!assets?.length) throw new Error('No generated classroom asset is available for assignment E2E');

      const reuseResponse = await fetch(`/teacher/api/teacher/library/assets/${assets[0].id}/reuse`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ classId: createdClass.id, title: assignmentTitle }),
      });
      if (!reuseResponse.ok) throw new Error(`Reuse asset failed: ${reuseResponse.status} ${await reuseResponse.text()}`);
      const assignment = (await reuseResponse.json()).assignment;

      const releaseResponse = await fetch(`/teacher/api/teacher/assignments/${assignment.id}/release`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!releaseResponse.ok) throw new Error(`Release failed: ${releaseResponse.status} ${await releaseResponse.text()}`);

      return { joinCode: createdClass.join_code, assignmentId: assignment.id };
    }, { className, assignmentTitle });

    expect(setup.joinCode).toMatch(/^[A-Z0-9]{8}$/);
    await teacher.goto(`${TEACHER}/teacher/teacher/assignments/${setup.assignmentId}`);
    await expect(teacher.getByText('Released', { exact: true })).toBeVisible();
    await teacherContext.close();

    const studentContext = await browser.newContext();
    const student = await studentContext.newPage();
    const phone = `+9198${Date.now().toString().slice(-8)}`;

    await student.goto(`${PORTAL}/login/student`, { waitUntil: 'load' });
    await student.getByRole('textbox', { name: 'Join Code' }).fill(setup.joinCode);
    await student.getByRole('textbox', { name: 'Phone Number' }).fill(phone);
    await student.getByRole('textbox', { name: 'Your Name' }).fill('Public E2E Student');
    await student.getByRole('button', { name: 'Join Classroom' }).click();

    await student.waitForURL(url => /^https:\/\/study\.devstudios\.me\/student\/?$/.test(url.href));
    await expect(student.getByRole('heading', { name: 'Student Dashboard' })).toBeVisible();
    await expect(student.getByText(assignmentTitle, { exact: true })).toBeVisible();

    await student.getByRole('link', { name: /^Assignments/ }).click();
    await expect(student).toHaveURL(`${STUDENT}/student/assignments`);
    await expect(student.getByRole('heading', { name: 'My Assignments' })).toBeVisible();
    await expect(student.getByText(assignmentTitle, { exact: true })).toBeVisible();
    await studentContext.close();
  });
});