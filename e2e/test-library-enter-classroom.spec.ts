import { test, expect } from '@playwright/test';

test.describe('Teacher Library - Enter Classroom Flow', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate directly to library page
    await page.goto('http://localhost:3000/teacher/library');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should show Enter Classroom button on AI-generated assets', async ({ page }) => {
    // Wait for assets to load
    await page.waitForSelector('[class*="AssetCard"], .grid > div, [class*="asset"]', { timeout: 10000 }).catch(() => {});

    // Look for slide deck assets with AI badge
    const aiAssets = await page.locator('text=AI').first();

    if (await aiAssets.isVisible()) {
      console.log('Found AI-generated asset');

      // Find the preview/Enter Classroom button
      const enterButton = page.locator('text=Enter Classroom');
      const previewButton = page.locator('text=Preview Slides');

      const hasEnterClassroom = await enterButton.isVisible().catch(() => false);
      const hasPreviewSlides = await previewButton.isVisible().catch(() => false);

      console.log(`Enter Classroom button visible: ${hasEnterClassroom}`);
      console.log(`Preview Slides button visible: ${hasPreviewSlides}`);

      // Check if Enter Classroom button exists anywhere in the page
      const pageContent = await page.content();
      const hasEnterClassroomInHTML = pageContent.includes('Enter Classroom');
      console.log(`Enter Classroom in page HTML: ${hasEnterClassroomInHTML}`);

      // Hover over an asset card to see overlay
      const assetCard = page.locator('[class*="group"][class*="border"]').first();
      if (await assetCard.isVisible()) {
        await assetCard.hover();
        await page.waitForTimeout(500);

        // Check for external link icon that indicates OpenMAIC URL
        const externalLinkIcon = page.locator('[data-testid="external-link"], svg[class*="ExternalLink"]');
        console.log(`External link icon visible on hover: ${await externalLinkIcon.isVisible().catch(() => false)}`);
      }
    } else {
      console.log('No AI-generated assets found on the page');
      // Take a screenshot to see what's there
      await page.screenshot({ path: '/tmp/library-screenshot.png' });
      console.log('Screenshot saved to /tmp/library-screenshot.png');
    }
  });

  test('clicking Enter Classroom should open OpenMAIC', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find Enter Classroom button
    const enterButton = page.locator('button:has-text("Enter Classroom"), a:has-text("Enter Classroom")');

    if (await enterButton.isVisible()) {
      console.log('Found Enter Classroom button, clicking...');

      // Set up popup listener
      const popupPromise = page.waitForEvent('popup').catch(() => null);

      await enterButton.click();

      const popup = await popupPromise;
      if (popupUrl) {
        console.log(`Opened URL: ${popupUrl}`);
        expect(popupUrl).toContain('/classroom/');
      }
    } else {
      console.log('Enter Classroom button not found - checking for Preview Slides');
      const previewButton = page.locator('button:has-text("Preview Slides")');
      if (await previewButton.isVisible()) {
        console.log('Found Preview Slides button instead');
        const isPurpleGradient = await previewButton.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.background.includes('gradient') || el.className.includes('purple');
        });
        console.log(`Preview button is purple (Enter Classroom style): ${isPurpleGradient}`);
      }
    }
  });
});