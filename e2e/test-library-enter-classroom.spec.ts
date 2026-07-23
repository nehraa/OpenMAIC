import { test, expect } from '@playwright/test';

const classroomAsset = {
  id: 'asset-1',
  type: 'slide_deck',
  title: 'Photosynthesis classroom',
  subject_tag: 'OpenMAIC',
  source_kind: 'ai_generated',
  source_ref: 'openmaic:room-1',
  created_at: '2026-07-23T10:00:00.000Z',
  updated_at: '2026-07-23T10:00:00.000Z',
  version_count: 1,
  latest_version_id: 'version-1',
  latest_payload: { openmaicClassroomId: 'room-1' },
};

test.describe('Teacher Library generation feedback', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      { name: 'access_token', value: 'test-token', url: 'http://localhost:3002' },
    ]);
    await page.addInitScript(() => localStorage.setItem('session_id', 'teacher-session'));
    await page.route('**/teacher/api/auth/me', async (route) => {
      await route.fulfill({
        json: {
          id: 'teacher-1',
          email: 'teacher@example.com',
          role: 'teacher',
          name: 'Test Teacher',
        },
      });
    });
    await page.route('**/teacher/api/teacher/library/assets?**', async (route) => {
      await route.fulfill({ json: { assets: [classroomAsset], total: 1 } });
    });
    await page.route('**/teacher/api/teacher/classes', async (route) => {
      await route.fulfill({ json: { classes: [] } });
    });
    await page.route('**/teacher/api/teacher/access-code', async (route) => {
      await route.fulfill({ json: { enabled: true, code: 'CLASS-2026' } });
    });
  });

  test('shows and copies the access code beside Enter Classroom', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/teacher/teacher/library');

    const code = page.getByTestId('library-access-code');
    await expect(code).toContainText('CLASS-2026');
    await code.getByRole('button', { name: 'Copy access code' }).click();

    await expect(code.getByRole('button', { name: 'Copy access code' })).toHaveText('Copied');
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('CLASS-2026');
  });

  test('shows real Core progress for OpenMAIC generation', async ({ page }) => {
    await page.route('**/teacher/api/teacher/library/generate-classroom', async (route) => {
      await route.fulfill({ status: 202, json: { jobId: 'openmaic-job-1', status: 'pending' } });
    });
    await page.route('**/teacher/api/teacher/library/generate-classroom-status/openmaic-job-1', async (route) => {
      await route.fulfill({
        json: {
          status: 'pending',
          progress: 54,
          step: 'generating_scenes',
          message: 'Generating scene 3 of 5',
          scenesGenerated: 3,
          totalScenes: 5,
        },
      });
    });
    await page.goto('/teacher/teacher/library');

    await page.getByRole('button', { name: 'Generate OpenMAIC Classroom' }).click();
    await page.getByPlaceholder('Photosynthesis for 8th graders').fill('Photosynthesis');
    await page.getByRole('button', { name: 'Generate Classroom' }).click();

    const progress = page.getByRole('progressbar');
    await expect(progress).toHaveAttribute('aria-valuenow', '54');
    await expect(page.getByText('Generating scene 3 of 5')).toBeVisible();
    await expect(page.getByText('3/5 scenes')).toBeVisible();
  });

  test('shows an indeterminate bar for opaque AI generation', async ({ page }) => {
    await page.route('**/teacher/api/teacher/library/generate', async (route) => {
      await route.fulfill({ status: 202, json: { jobId: 'ai-job-1', status: 'pending' } });
    });
    await page.route('**/teacher/api/teacher/library/generate-status/ai-job-1', async (route) => {
      await route.fulfill({ json: { status: 'pending' } });
    });
    await page.goto('/teacher/teacher/library');

    await page.getByRole('button', { name: 'Generate with AI' }).click();
    await page.getByPlaceholder('Introduction to Algebra for 8th Grade').fill('Algebra for eighth grade');
    await page.getByRole('button', { name: 'Generate Now' }).click();

    await expect(page.locator('progress:not([value])')).toBeVisible();
  });
});
