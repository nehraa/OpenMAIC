import { chromium } from '/home/Hermes/repos/OpenMAIC/node_modules/.pnpm/playwright@1.59.1/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
page.on('console', (msg) => console.log('[browser]', msg.type(), msg.text().slice(0, 250)));
page.on('response', (res) => {
  if (res.url().includes('/api/') || res.url().includes('classroom')) {
    console.log(`  [net] ${res.status()} ${res.request().method()} ${res.url().replace('http://localhost:3002', '')}`);
  }
});

await page.goto('http://localhost:3002/teacher/login/teacher', { waitUntil: 'domcontentloaded' });
await page.fill('#email', 'smoke.teacher@test.local');
await page.fill('#password', 'SmokeTest2024!');
await Promise.all([
  page.waitForURL((u) => /\/teacher($|\/)/.test(u.pathname) && !u.pathname.includes('/login'), { timeout: 15000 }),
  page.click('button[type="submit"]'),
]);
console.log('logged in, at:', page.url());

await page.goto('http://localhost:3002/teacher/library', { waitUntil: 'networkidle' });
console.log('library loaded');

await page.click('[data-testid="generate-openmaic-classroom"]');
await page.fill('textarea', 'Test prompt - ' + Date.now());
await page.click('button:has-text("Generate Classroom")');
console.log('generation kicked off');

// Watch for 60 seconds, take periodic snapshots
for (let i = 0; i < 12; i++) {
  await page.waitForTimeout(5000);
  const notifs = await page.locator('.fixed.top-6.right-6').allTextContents().catch(() => []);
  console.log(`[t+${(i+1)*5}s] notifications:`, JSON.stringify(notifs));
  await page.screenshot({ path: `/tmp/smoke-notif-${i}.png` });
}

await browser.close();