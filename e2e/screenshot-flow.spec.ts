import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:3001';
const SCREENSHOT_DIR = '/Users/abhinavnehra/git/tools/OpenMAIC/test-results';

test('Teacher generates slides and screenshots the full flow', async ({ page }) => {
  // Login
  await page.goto(`${APP_URL}/login/teacher`);
  await page.waitForLoadState('networkidle');
  await page.fill('#email', 'playwright@test.com');
  await page.fill('#password', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/teacher/, { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Go to Library
  await page.goto(`${APP_URL}/teacher/library`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/03-library.png` });

  // Get page structure to understand what's on the page
  const bodyHTML = await page.locator('body').innerHTML();
  console.log('Body HTML (first 2000 chars):', bodyHTML.substring(0, 2000));

  // Count all divs with border class
  const allBorderDivs = await page.locator('[class*="border"]').count();
  console.log(`Found ${allBorderDivs} elements with 'border' class`);

  console.log('\n=== DONE ===');
});