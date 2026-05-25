import { test, expect } from '@playwright/test';

test('check teacher dashboard for JS errors', async ({ page }) => {
  const jsErrors: string[] = [];
  page.on('pageerror', err => jsErrors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('401')) {
      jsErrors.push(msg.text());
    }
  });
  
  await page.goto('http://localhost:3001/login/teacher');
  await page.fill('input[type="email"]', 'playwright@test.com');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('**/teacher**', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/teacher-dash-final.png', fullPage: true });
  
  console.log('URL:', page.url());
  console.log('JS Errors:', jsErrors);
  
  // Get visible text
  const h1 = await page.locator('h1').first().textContent().catch(() => 'none');
  console.log('H1:', h1);
  
  if (jsErrors.length > 0) {
    console.log('ERRORS FOUND:', jsErrors);
  }
});
