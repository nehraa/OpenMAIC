import { test, expect } from '@playwright/test';

test('Prod teach: API returns PHYSIO, badge shows PHYSIO with mock asset, classroom code verification', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  // 1. Login via parent SSO
  await page.goto('https://openmaic.devstudios.me/login/teacher');
  await page.fill('input#email', 'adam.test@probe.local');
  await page.fill('input#password', 'TestPass123!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/teach\.devstudios\.me/, { timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  // 2. Library + mock asset list (so we can test the badge without a real generation)
  await context.route('**/teacher/api/teacher/library/assets**', async (route) => {
    await route.fulfill({
      json: {
        assets: [{
          id: 'asset-test-1',
          type: 'slide_deck',
          title: 'Photosynthesis classroom',
          subject_tag: 'OpenMAIC',
          source_kind: 'ai_generated',
          source_ref: 'openmaic:room-test-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version_count: 1,
          latest_version_id: 'v1',
          latest_payload: { openmaicClassroomId: 'room-test-1' },
        }],
        total: 1,
      },
    });
  });
  await page.goto('https://teach.devstudios.me/teacher/teacher/library');
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  // 3. Verify access-code API returns PHYSIO
  const apiResp = await page.evaluate(async () => {
    const r = await fetch('/teacher/api/teacher/access-code', { credentials: 'include' });
    return { status: r.status, body: await r.text() };
  });
  console.log('access-code API:', apiResp);
  expect(JSON.parse(apiResp.body)).toEqual({ enabled: true, code: 'PHYSIO' });

  // 4. Verify the badge shows PHYSIO
  const badge = page.getByTestId('library-access-code');
  await expect(badge).toBeVisible({ timeout: 10000 });
  const badgeText = (await badge.textContent()) ?? '';
  console.log('Badge text:', badgeText);
  expect(badgeText).toContain('PHYSIO');
  await page.screenshot({ path: '/tmp/prod-teach-badge.png', fullPage: true });

  // 5. Click copy
  const copyButton = badge.getByRole('button', { name: 'Copy access code' });
  await copyButton.click();
  await expect(copyButton).toHaveText('Copied');
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toBe('PHYSIO');
  console.log('Clipboard verified: PHYSIO');

  // 6. Click Enter Classroom, then enter PHYSIO in Core
  const [popup] = await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('link', { name: 'Enter Classroom' }).first().click(),
  ]);
  await popup.waitForLoadState('domcontentloaded', { timeout: 20000 });
  console.log('Classroom URL:', popup.url());
  await popup.waitForTimeout(2000);
  await popup.screenshot({ path: '/tmp/prod-classroom.png', fullPage: true });

  const classBody = await popup.locator('body').textContent();
  console.log('Classroom body excerpt:', (classBody ?? '').substring(0, 500));

  // 7. Type PHYSIO in any visible code input
  const codeInput = popup.locator('input[type="text"], input[type="password"]').first();
  if (await codeInput.count() > 0 && await codeInput.isVisible()) {
    await codeInput.fill('PHYSIO');
    await popup.keyboard.press('Enter');
    await popup.waitForTimeout(4000);
    await popup.screenshot({ path: '/tmp/prod-classroom-after-code.png', fullPage: true });
    const afterBody = await popup.locator('body').textContent();
    console.log('After code body:', (afterBody ?? '').substring(0, 800));
    const bad = (afterBody ?? '').toLowerCase().match(/invalid|incorrect|try again|wrong/);
    console.log('Bad-text match:', bad?.[0] ?? 'none');
    expect(bad).toBeNull();
  } else {
    console.log('No visible code input on classroom page — checking response from Core verify endpoint directly');
    const verifyResp = await popup.evaluate(async () => {
      const r = await fetch('/classroom/api/access-code/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'PHYSIO' }),
        credentials: 'include',
      });
      return { status: r.status, body: await r.text() };
    });
    console.log('Direct verify:', verifyResp);
    expect(verifyResp.status).toBe(200);
    expect(JSON.parse(verifyResp.body).valid).toBe(true);
  }
});
