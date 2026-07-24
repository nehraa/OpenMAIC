import { chromium } from '/home/Hermes/repos/OpenMAIC/node_modules/.pnpm/playwright@1.59.1/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
page.on('console', (msg) => console.log('[browser]', msg.type(), msg.text().slice(0, 200)));
page.on('pageerror', (err) => console.log('[pageerror]', err.message.slice(0, 200)));

await page.goto('http://127.0.0.1:3002/teacher/login/teacher', { waitUntil: 'domcontentloaded' });
await page.fill('#email', 'smoke.teacher@test.local');
await page.fill('#password', 'SmokeTest2024!');
await Promise.all([
  page.waitForURL(/\/teacher(?!\/login)/, { timeout: 15000 }),
  page.click('button[type="submit"]'),
]);
console.log('logged in, at:', page.url());

// Try both candidate library URLs
for (const libUrl of [
  'http://127.0.0.1:3002/teacher/library',
  'http://127.0.0.1:3002/teacher/teacher/library',
]) {
  console.log(`\n--- visiting ${libUrl} ---`);
  await page.goto(libUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);
  console.log(`final url: ${page.url()}`);
  const visibleButtons = await page.locator('button:visible, a:visible').all();
  for (const b of visibleButtons) {
    const text = await b.innerText().catch(() => '');
    if (text.trim()) console.log(`  button/link: "${text.replace(/\n/g, ' ').substring(0, 80)}"`);
  }
  await page.screenshot({ path: `/tmp/library-${libUrl.endsWith('/library') ? 'a' : 'b'}.png`, fullPage: true });
}

await browser.close();