/**
 * Minimal Playwright script to debug teacher login issue
 */

import { test, expect, Page } from '@playwright/test';

const APP_URL = 'http://localhost:3001';
const TEACHER_EMAIL = 'demo@aidu.tech';
const TEACHER_PASSWORD = 'Demo2024!';

async function debugLogin(page: Page) {
  console.log('=== Starting Login Debug ===');

  // Navigate to login page
  await page.goto(`${APP_URL}/login/teacher`);
  await page.waitForLoadState('domcontentloaded');
  console.log('1. Navigated to login page');

  // Fill in credentials
  await page.fill('input[id="email"]', TEACHER_EMAIL);
  await page.fill('input[id="password"]', TEACHER_PASSWORD);
  console.log('2. Filled in credentials');

  // Submit
  await page.click('button[type="submit"]');
  console.log('3. Clicked submit');

  // Wait for response
  await page.waitForTimeout(3000);
  console.log('4. Waited for response');

  // Check for errors - use a safer selector
  const errorLocator = page.locator('.text-red-600\\/90');
  const hasError = await errorLocator.count() > 0;
  if (hasError) {
    const errorText = await errorLocator.first().textContent();
    console.log(`ERROR FOUND: ${errorText}`);
  } else {
    console.log('No error displayed');
  }

  // Check URL
  console.log(`Current URL: ${page.url()}`);
  if (page.url().includes('/teacher')) {
    console.log('SUCCESS: Redirected to teacher dashboard');
  }

  // Get page content for debugging
  const content = await page.content();
  console.log('Page contains "invalid":', content.toLowerCase().includes('invalid'));
  console.log('Page contains "error":', content.toLowerCase().includes('error'));
  console.log('Page contains "login":', content.toLowerCase().includes('login'));

  return { hasError };
}

test('debug teacher login', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await debugLogin(page);
});