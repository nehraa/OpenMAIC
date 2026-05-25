import { test, expect } from '@playwright/test';

test.describe('Teacher Library - Screenshot Debug', () => {

  test('take screenshot and inspect asset card structure', async ({ page }) => {
    await page.goto('http://localhost:3000/teacher/library');
    await page.waitForLoadState('networkidle');

    // Wait for assets to load
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: '/tmp/openmaic-library.png', fullPage: true });
    console.log('Screenshot saved to /tmp/openmaic-library.png');

    // Get all text content
    const bodyText = await page.locator('body').innerText();
    console.log('Page text content:', bodyText.substring(0, 500));

    // Check for AI badge
    const aiBadge = page.locator('text=✨ AI');
    const aiBadgeVisible = await aiBadge.isVisible().catch(() => false);
    console.log('AI badge visible:', aiBadgeVisible);

    if (aiBadgeVisible) {
      // Get the parent card of AI badge
      const card = aiBadge.locator('xpath=ancestor::div[contains(@class,"border")]').first();
      if (await card.isVisible()) {
        // Check what buttons are in the card
        const cardHtml = await card.innerHTML();
        console.log('Card contains Preview:', cardHtml.includes('Preview'));
        console.log('Card contains Enter Classroom:', cardHtml.includes('Enter Classroom'));
        console.log('Card contains source_ref:', cardHtml.includes('source_ref'));
        console.log('Card contains openmaicUrl:', cardHtml.includes('openmaicUrl'));
        console.log('Card contains ExternalLink:', cardHtml.includes('ExternalLink'));
        console.log('Card contains PlayCircle:', cardHtml.includes('PlayCircle'));
      }
    }

    // Check all buttons on the page
    const allButtons = await page.locator('button').all();
    console.log('Total buttons:', allButtons.length);
    for (const btn of allButtons) {
      const text = await btn.textContent();
      const classes = await btn.getAttribute('class');
      console.log(`Button: "${text?.trim()}" - classes: ${classes?.substring(0, 50)}...`);
    }
  });

  test('check if asset has source_ref populated', async ({ page }) => {
    await page.goto('http://localhost:3000/teacher/library');
    await page.waitForLoadState('networkidle');

    // Inject script to check asset source_ref values
    const result = await page.evaluate(async () => {
      // Get the assets from the page state
      // Try to find assets in localStorage or sessionStorage
      const storageKeys = Object.keys(localStorage);
      const relevantKeys = storageKeys.filter(k => k.includes('asset') || k.includes('library'));
      return {
        storageKeys,
        relevantKeys
      };
    });
    console.log('Storage keys:', result);

    // Just take screenshot and see the actual page
    await page.screenshot({ path: '/tmp/openmaic-library-2.png', fullPage: true });
  });
});