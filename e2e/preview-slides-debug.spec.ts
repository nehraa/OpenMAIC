import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:3001';
const TEACHER_EMAIL = 'demo@aidu.tech';
const TEACHER_PASSWORD = 'Demo2024!';

test('Debug - use correct login approach', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });

  // Login via API like working tests
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
  console.log('Login response user:', user?.email);

  // Set tokens in localStorage
  await page.goto(`${APP_URL}/login/teacher`);
  await page.evaluate((tokens) => {
    localStorage.setItem('session_id', tokens.access_token);
    localStorage.setItem('user', JSON.stringify(tokens.user));
  }, { access_token, refresh_token, user });

  // Go to Library
  await page.goto(`${APP_URL}/teacher/library`);
  await page.waitForLoadState('networkidle');
  
  const sessionCheck = await page.evaluate(() => localStorage.getItem('session_id'));
  console.log('Session after setting:', sessionCheck?.substring(0, 20));

  // Click Generate with AI
  await page.click('button:has-text("Generate with AI")');
  await page.waitForSelector('textarea', { timeout: 5000 });
  await page.click('button:has-text("Slide Deck")');
  await page.fill('textarea', 'Introduction to Algebra');
  await page.click('button:has-text("Generate Now")');
  
  console.log('Generate clicked, waiting...');
  await page.waitForTimeout(8000);
  
  // Check for errors
  const errorEl = page.locator('.text-red-600');
  const hasError = await errorEl.isVisible().catch(() => false);
  console.log('Has error:', hasError);
  if (hasError) {
    console.log('Error text:', await errorEl.textContent());
  }
  
  // Check if modal closed (success)
  const modalVisible = await page.locator('button:has-text("Generate Now")').isVisible().catch(() => false);
  console.log('Modal visible (should be false on success):', modalVisible);
  
  // Check library for assets
  const text = await page.locator('body').textContent();
  console.log('Contains "Preview Slides":', text.includes('Preview Slides'));
  console.log('Contains "assets":', text.includes('assets'));
  
  await page.screenshot({ path: '/tmp/login-debug.png', fullPage: true });
});
