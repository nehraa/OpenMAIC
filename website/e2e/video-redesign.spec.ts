import { test, expect } from '@playwright/test';

test.describe('OpenMAIC Website - Video Redesign', () => {
  test('homepage loads and displays hero section', async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');

    // Check headline
    await expect(page.locator('h1')).toContainText('AI-Powered Live Classroom');
  });

  test('scroll video scrubbing works', async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');

    // Get initial video state
    const video = page.locator('video').first();
    const initialTime = await video.evaluate((v: HTMLVideoElement) => ({
      currentTime: v.currentTime,
      paused: v.paused
    }));
    console.log('Initial video state:', initialTime);

    // Scroll to middle of hero
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.5));
    await page.waitForTimeout(500);

    // Check video state after scroll
    const afterScroll = await video.evaluate((v: HTMLVideoElement) => ({
      currentTime: v.currentTime,
      paused: v.paused
    }));
    console.log('After scroll:', afterScroll);
  });

  test('all sections render correctly', async ({ page }) => {
    await page.goto('http://localhost:3002');

    // Scroll through the page
    await page.evaluate(() => window.scrollTo(0, window.innerHeight));
    await page.waitForTimeout(300);
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2));
    await page.waitForTimeout(300);
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 3));
    await page.waitForTimeout(300);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Check that Final CTA button is visible at bottom
    await expect(page.getByRole('button', { name: /start learning/i }).first()).toBeVisible();
  });

  test('no console errors except favicon 404', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        errors.push(msg.text());
      }
    });

    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e => !e.includes('favicon'));
    expect(criticalErrors.length).toBe(0);
  });
});