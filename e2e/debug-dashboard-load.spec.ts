import { test, expect } from '@playwright/test';

test('debug dashboard data loading', async ({ page }) => {
  const networkErrors: string[] = [];
  const consoleLogs: string[] = [];
  
  page.on('response', async resp => {
    if (resp.url().includes('/api/teacher/')) {
      const status = resp.status();
      const body = await resp.text().catch(() => 'N/A');
      consoleLogs.push(`${resp.url()} -> ${status}: ${body.slice(0, 200)}`);
    }
  });
  
  page.on('pageerror', err => {
    consoleLogs.push(`PAGE ERROR: ${err.message}`);
  });
  
  await page.goto('http://localhost:3001/login/teacher');
  await page.fill('input[type="email"]', 'playwright@test.com');
  await page.fill('input[type="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('**/teacher**', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(3000);
  
  console.log('=== Network/Console Logs ===');
  consoleLogs.forEach(log => console.log(log));
  
  // Check what's showing
  const classesSection = await page.locator('text=Your Classes').locator('..').textContent();
  const assignmentsSection = await page.locator('text=Recent Assignments').locator('..').textContent();
  
  console.log('\n=== Classes Section ===');
  console.log(classesSection);
  
  console.log('\n=== Assignments Section ===');
  console.log(assignmentsSection);
  
  await page.screenshot({ path: '/tmp/dashboard-debug.png', fullPage: true });
});
