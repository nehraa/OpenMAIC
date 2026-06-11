import { test, expect, Page } from '@playwright/test';

const APP_URL = 'http://localhost:3001';
const TEACHER_EMAIL = 'demo@aidu.tech';
const TEACHER_PASSWORD = 'Demo2024!';

test('debug login flow', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });

  console.log('1. Navigating to login page');
  await page.goto(`${APP_URL}/login/teacher`);
  await page.waitForLoadState('domcontentloaded');

  console.log('2. Filling credentials');
  await page.fill('input[id="email"]', TEACHER_EMAIL);
  await page.fill('input[id="password"]', TEACHER_PASSWORD);

  console.log('3. Submitting');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(3000);

  console.log('4. Current URL:', page.url());

  // Check for error message
  const errorEl = page.locator('.text-red-600\\/90, [class*="error"]');
  if (await errorEl.count() > 0) {
    console.log('ERROR:', await errorEl.first().textContent());
  }

  // Check page content
  const content = await page.content();
  console.log('Contains "invalid":', content.toLowerCase().includes('invalid'));
  console.log('Contains "error":', content.toLowerCase().includes('error'));
  console.log('Contains "login":', content.toLowerCase().includes('login'));
});