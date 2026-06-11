import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:3001';
const TEACHER_EMAIL = 'demo@aidu.tech';
const TEACHER_PASSWORD = 'Demo2024!';

test('Library - Preview Slides button works', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });

  // Login
  await page.goto(`${APP_URL}/login/teacher`);
  await page.waitForLoadState('domcontentloaded');
  await page.fill('input[id="email"]', TEACHER_EMAIL);
  await page.fill('input[id="password"]', TEACHER_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/teacher**', { timeout: 10000 });

  // Go to Library
  await page.goto(`${APP_URL}/teacher/library`);
  await page.waitForLoadState('networkidle');

  // Click Generate with AI to create a slide deck
  await page.click('button:has-text("Generate with AI")');
  await page.waitForSelector('textarea', { timeout: 5000 });

  // Select Slide Deck
  await page.click('button:has-text("Slide Deck")');
  
  // Enter prompt and generate
  await page.fill('textarea', 'Introduction to Algebra for 8th Grade');
  await page.click('button:has-text("Generate Now")');
  
  // Wait for generation (mock takes ~5 seconds)
  await page.waitForTimeout(8000);
  
  // Close modal by clicking outside or pressing escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(2000);
  
  // Reload to get fresh data
  await page.reload();
  await page.waitForLoadState('networkidle');
  
  // Click "Slides" filter to see slide decks
  await page.click('button:has-text("Slides")');
  await page.waitForTimeout(1000);
  
  // Look for Preview Slides button
  const previewButtons = page.locator('button:has-text("Preview Slides")');
  const count = await previewButtons.count();
  console.log(`Found ${count} Preview Slides buttons`);
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/library-preview-test.png', fullPage: true });
  console.log('Screenshot saved to /tmp/library-preview-test.png');
  
  expect(count).toBeGreaterThan(0);
});
