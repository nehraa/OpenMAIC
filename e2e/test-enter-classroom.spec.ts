import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:3001';
const TEACHER_EMAIL = 'demo@aidu.tech';
const TEACHER_PASSWORD = 'Demo2024!';

test('Generate and check all buttons on slide cards', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });

  // Login via API
  let response;
  for (let attempt = 1; attempt <= 3; attempt++) {
    response = await page.request.post(`${APP_URL}/api/auth/login`, {
      data: {
        email: TEACHER_EMAIL,
        password: TEACHER_PASSWORD
      }
    });
    if (response.ok()) break;
    if (response.status() === 429 && attempt < 3) {
      await page.waitForTimeout(2000);
    } else {
      break;
    }
  }

  const data = await response.json();
  const { access_token, refresh_token, user } = data;

  // Set tokens in localStorage
  await page.goto(`${APP_URL}/login/teacher`);
  await page.evaluate((tokens) => {
    localStorage.setItem('session_id', tokens.access_token);
    localStorage.setItem('user', JSON.stringify(tokens.user));
  }, { access_token, refresh_token, user });

  // Go to Library
  await page.goto(`${APP_URL}/teacher/library`);
  await page.waitForLoadState('networkidle');

  // Click Slides filter to only see slide decks
  await page.click('button:has-text("Slides")');
  await page.waitForTimeout(1000);
  
  // Check for Preview Slides buttons
  const previewBtns = page.locator('button:has-text("Preview Slides")');
  const previewCount = await previewBtns.count();
  console.log('Preview Slides buttons count:', previewCount);
  
  // Check for Use buttons
  const useBtns = page.locator('button:has-text("Use")');
  const useCount = await useBtns.count();
  console.log('Use buttons count:', useCount);
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/test-enter-classroom.png', fullPage: true });
  console.log('Screenshot saved');
  
  // Check asset count
  const bodyText = await page.locator('body').textContent();
  const assetsMatch = bodyText.match(/(\d+)\s+assets/);
  console.log('Total assets:', assetsMatch ? assetsMatch[1] : 'unknown');
});
