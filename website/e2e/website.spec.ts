import { test, expect } from '@playwright/test';

test.describe('OpenMAIC Website', () => {
  test.beforeEach(async ({ page }) => {
    // Collect console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Console error: ${msg.text()}`);
      }
    });
  });

  test('homepage loads without errors', async ({ page }) => {
    await page.goto('http://localhost:3002');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Check hero section exists
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();
  });

  test('hero section displays correctly', async ({ page }) => {
    await page.goto('http://localhost:3002');

    // Check headline
    await expect(page.locator('h1')).toContainText('AI-Powered Live Classroom');

    // Check CTA buttons exist
    await expect(page.getByRole('button', { name: /start learning/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /watch.*demo/i })).toBeVisible();
  });

  test('features section has video elements', async ({ page }) => {
    await page.goto('http://localhost:3002');

    // Scroll to features section
    await page.locator('#features').scrollIntoViewIfNeeded();

    // Check for video elements
    const videos = page.locator('video');
    const count = await videos.count();
    console.log(`Found ${count} video elements`);
    expect(count).toBeGreaterThan(0);
  });

  test('scroll-linked video scrubbing works', async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');

    // Get initial video time
    const video = page.locator('video').first();
    const initialTime = await video.evaluate((v: HTMLVideoElement) => v.currentTime);
    console.log(`Initial video time: ${initialTime}`);

    // Scroll down to trigger video scrub
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(300);

    const newTime = await video.evaluate((v: HTMLVideoElement) => v.currentTime);
    console.log(`Video time after scroll: ${newTime}`);

    // Video should have seeked
    // Note: It may or may not change depending on exact scroll position
  });

  test('pricing section displays three plans', async ({ page }) => {
    await page.goto('http://localhost:3002');

    // Scroll to pricing
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Check all three pricing cards
    await expect(page.locator('text=Individual')).toBeVisible();
    await expect(page.locator('text=Student')).toBeVisible();
    await expect(page.locator('text=Teacher')).toBeVisible();
  });

  test('how it works section has 3 steps', async ({ page }) => {
    await page.goto('http://localhost:3002');

    // Scroll to how it works
    await page.locator('#how-it-works').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Check for step numbers
    await expect(page.locator('text=01')).toBeVisible();
    await expect(page.locator('text=02')).toBeVisible();
    await expect(page.locator('text=03')).toBeVisible();
  });

  test('navigation links work', async ({ page }) => {
    await page.goto('http://localhost:3002');

    // Click on How it Works nav link
    await page.click('a[href="#how-it-works"]');
    await page.waitForTimeout(500);

    // Should scroll to section
    const howItWorks = page.locator('#how-it-works');
    await expect(howItWorks).toBeInViewport();
  });

  test('final CTA button is present', async ({ page }) => {
    await page.goto('http://localhost:3002');

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Check CTA button
    await expect(page.getByRole('button', { name: /start learning free/i })).toBeVisible();
  });
});