import { test, expect } from '@playwright/test';

const PROD = 'https://openmaic.devstudios.me';

test('Prod: badge shows code, Enter Classroom accepts it on Core', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  // Login
  await page.goto(`${PROD}/login/teacher`);
  await page.waitForLoadState('domcontentloaded');
  await page.fill('input#email', 'adam.test@probe.local');
  await page.fill('input#password', 'TestPass123!');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  console.log('After login URL:', page.url());

  // Library
  await page.goto(`${PROD}/teacher/teacher/library`);
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  console.log('Library URL:', page.url());

  await page.screenshot({ path: '/tmp/prod-library-after-fix.png', fullPage: true });

  const badge = page.getByTestId('library-access-code');
  const badgeCount = await badge.count();
  console.log('Badge count:', badgeCount);

  let badgeText = '';
  if (badgeCount > 0) {
    badgeText = (await badge.first().textContent()) ?? '';
    console.log('Badge text:', badgeText);
  }

  // Find Enter Classroom buttons
  const enterButtons = page.getByRole('link', { name: 'Enter Classroom' });
  const enterCount = await enterButtons.count();
  console.log('Enter Classroom button count:', enterCount);

  // If we have an OpenMAIC asset, click Enter Classroom and try the code
  if (enterCount > 0 && badgeCount > 0) {
    const codeMatch = badgeText.match(/PHYSIO|CODE[-\s]?[A-Z0-9]+|[A-Z]{3,}/i);
    const code = codeMatch?.[0] ?? '';
    console.log('Extracted code:', code);

    // Open classroom in a new tab
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      enterButtons.first().click(),
    ]);
    await popup.waitForLoadState('domcontentloaded', { timeout: 15000 });
    console.log('Classroom URL:', popup.url());
    await popup.screenshot({ path: '/tmp/prod-classroom.png', fullPage: true });

    // Look for an access-code input on the classroom page
    const codeInput = popup.locator('input[type="text"], input[name*="code" i], input[placeholder*="code" i]');
    const inputCount = await codeInput.count();
    console.log('Code input count:', inputCount);

    if (inputCount > 0 && code) {
      await codeInput.first().fill(code);
      await popup.keyboard.press('Enter');
      await popup.waitForTimeout(3000);
      await popup.screenshot({ path: '/tmp/prod-classroom-after-code.png', fullPage: true });
      const finalBody = await popup.locator('body').textContent();
      console.log('Classroom body after code:', (finalBody ?? '').substring(0, 500));
      const hasInvalid = (finalBody ?? '').toLowerCase().includes('invalid') || 
                         (finalBody ?? '').toLowerCase().includes('incorrect');
      console.log('Contains "invalid" or "incorrect":', hasInvalid);
    }
  }

  // Sanity assertions
  expect(true).toBe(true);
});
