import { test, expect } from '@playwright/test';

test.describe('Teacher Library - Debug', () => {

  test('check page content and asset cards', async ({ page }) => {
    await page.goto('http://localhost:3000/teacher/library');
    await page.waitForLoadState('networkidle');

    // Get full page content for debugging
    const html = await page.content();

    // Check if AI text appears anywhere
    const aiCount = (html.match(/AI/g) || []).length;
    console.log(`'AI' appears ${aiCount} times in page`);

    // Look for button text
    const hasPreviewSlides = html.includes('Preview Slides');
    const hasEnterClassroom = html.includes('Enter Classroom');
    const hasExternalLink = html.includes('ExternalLink');
    const hasPlayCircle = html.includes('PlayCircle');

    console.log(`Has 'Preview Slides': ${hasPreviewSlides}`);
    console.log(`Has 'Enter Classroom': ${hasEnterClassroom}`);
    console.log(`Has 'ExternalLink': ${hasExternalLink}`);
    console.log(`Has 'PlayCircle': ${hasPlayCircle}`);

    // Check for asset cards
    const buttons = await page.locator('button').allTextContents();
    console.log('Buttons found:', buttons);

    // Check for specific class patterns
    const assetCards = page.locator('[class*="border"][class*="rounded"]');
    const cardCount = await assetCards.count();
    console.log(`Asset cards found: ${cardCount}`);

    // Take screenshot
    await page.screenshot({ path: '/tmp/library-debug.png', fullPage: true });
    console.log('Screenshot saved to /tmp/library-debug.png');

    // Get computed style of a button to check background
    const previewBtn = page.locator('button:has-text("Preview Slides")').first();
    if (await previewBtn.isVisible()) {
      const bg = await previewBtn.evaluate(el => window.getComputedStyle(el).background);
      console.log(`Preview button background: ${bg.substring(0, 100)}...`);
    }
  });

  test('trigger generation and check result', async ({ page }) => {
    await page.goto('http://localhost:3000/teacher/library');
    await page.waitForLoadState('networkidle');

    // Click Generate with AI button
    const generateBtn = page.locator('button:has-text("Generate with AI")');
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
      await page.waitForTimeout(500);

      // Fill prompt
      const textarea = page.locator('textarea');
      if (await textarea.isVisible()) {
        await textarea.fill('Simple test course on math');

        // Click generate
        const submitBtn = page.locator('button:has-text("Generate")');
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          console.log('Clicked Generate button');

          // Wait for response
          await page.waitForTimeout(3000);

          // Check if success message appeared
          const html = await page.content();
          const hasSuccess = html.includes('Asset saved') || html.includes('successfully');
          console.log(`Generation success: ${hasSuccess}`);
        }
      }
    } else {
      console.log('Generate with AI button not found');
    }
  });
});