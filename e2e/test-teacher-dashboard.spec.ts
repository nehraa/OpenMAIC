import { test, expect } from '@playwright/test';

test('teacher dashboard after login', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  await page.goto('http://localhost:3001/login/teacher');
  await page.waitForLoadState('networkidle');
  
  console.log('1. Login page loaded:', page.url());
  
  // Use the correct test credentials
  await page.fill('input[type="email"]', 'playwright@test.com');
  await page.fill('input[type="password"]', 'testpass123');
  
  console.log('2. Filled credentials');
  
  await page.click('button[type="submit"]');
  
  // Wait for navigation
  await page.waitForURL('**/teacher**', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(3000);
  
  console.log('3. Current URL:', page.url());
  
  // Get page content
  const body = await page.textContent('body');
  console.log('4. Body preview:', body.slice(0, 500));
  
  // Check for errors
  if (errors.length) {
    console.log('5. Console errors:', errors);
  }
  
  // Check if dashboard loaded
  const hasDashboard = body.includes('Teacher Dashboard');
  console.log('6. Has Teacher Dashboard:', hasDashboard);
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/teacher-dashboard.png' });
  console.log('7. Screenshot saved');
  
  expect(hasDashboard).toBe(true);
});
