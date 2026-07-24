// Smoke test: login as demo teacher, generate OpenMAIC classroom, verify
// preview and enter-classroom flow end-to-end against the running dev server.
//
// Run with:  node /home/Hermes/repos/OpenMAIC/teacher/scripts/smoke-teacher-flow.mjs
//
// Resolution order for the browser binary:
//   1. PLAYWRIGHT_CHROMIUM env var (if set)
//   2. /root/.cache/ms-playwright/chromium-1223 (the install in this image)
//   3. Whatever Playwright picks up by default

import { chromium } from '/home/Hermes/repos/OpenMAIC/node_modules/.pnpm/playwright@1.59.1/node_modules/playwright/index.mjs';

const TEACHER_URL = 'http://localhost:3002/teacher';
const CORE_URL = 'http://localhost:3003';
const EMAIL = 'smoke.teacher@test.local';
const PASSWORD = 'SmokeTest2024!';
const PROMPT = 'Photosynthesis for 8th graders';
const GENERATION_TIMEOUT_MS = 8 * 60 * 1000; // 8 min — openmaic multi-agent can run 5–6 min

const launchOpts = { headless: true };
if (process.env.PLAYWRIGHT_CHROMIUM) launchOpts.executablePath = process.env.PLAYWRIGHT_CHROMIUM;
else {
  const fs = await import('node:fs');
  for (const v of ['1223', '1217']) {
    const p = `/root/.cache/ms-playwright/chromium-${v}/chrome-linux/chrome`;
    if (fs.existsSync(p)) { launchOpts.executablePath = p; break; }
  }
}

const browser = await chromium.launch(launchOpts);
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

const failures = [];
const check = (name, ok, detail = '') => {
  const status = ok ? 'PASS' : 'FAIL';
  console.log(`  [${status}] ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures.push(name);
};

try {
  console.log('1. Login');
  await page.goto(`${TEACHER_URL}/login/teacher`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[id="email"], input[name="email"], input[type="email"]', EMAIL);
  await page.fill('input[id="password"], input[name="password"], input[type="password"]', PASSWORD);
  await Promise.all([
    page.waitForURL((url) => /\/teacher($|\/)/.test(url.pathname) && !url.pathname.includes('/login'), { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);
  check('login redirects to /teacher', /\/teacher($|\/)/.test(new URL(page.url()).pathname) && !page.url().includes('/login'));

  console.log('2. Navigate to library');
  await page.goto(`${TEACHER_URL}/teacher/library`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="generate-openmaic-classroom"]', { timeout: 10000 });
  check('library page loaded with Generate OpenMAIC Classroom button', true);

  // Snapshot how many assets existed before, so we can identify the new one.
  const initialAssetCount = await page.locator('.grid > div').count();
  console.log(`   initial asset count: ${initialAssetCount}`);

  console.log('3. Kick off OpenMAIC classroom generation');
  await page.click('[data-testid="generate-openmaic-classroom"]');
  await page.waitForSelector('textarea', { timeout: 5000 });
  await page.fill('textarea', PROMPT);
  await page.click('button:has-text("Generate Classroom")');

  // The modal should close and a notification should appear.
  await page.waitForSelector('text=Generating OpenMAIC Classroom', { timeout: 10000 });
  check('generation kickoff shows pending notification', true);

  console.log('4. Wait for generation to complete');
  // Look for either "ready" or "failed" — both terminate the pending state.
  const completed = await Promise.race([
    page.waitForSelector('text=/ready|failed/', { timeout: GENERATION_TIMEOUT_MS }).then(() => 'terminal'),
    page.waitForSelector('text=failed', { timeout: GENERATION_TIMEOUT_MS }).then(() => 'failed'),
  ]);
  // Pull the visible status text
  const statusText = await page.locator('.bg-white.rounded-xl.shadow-xl').first().innerText().catch(() => '');
  console.log(`   notification now: ${statusText.replace(/\n/g, ' | ')}`);
  check('generation transitioned out of pending', /ready|failed/.test(statusText), statusText);

  if (/failed/i.test(statusText)) {
    console.log('   generation failed — entering diagnostic mode');
    await page.screenshot({ path: '/tmp/teacher-smoke-failed.png', fullPage: true });
  }

  // Give the asset list a moment to refresh after the completion effect.
  await page.waitForTimeout(2000);
  await page.reload({ waitUntil: 'networkidle' });

  console.log('5. Inspect the new asset card');
  const finalCount = await page.locator('.grid > div').count();
  console.log(`   final asset count: ${finalCount}`);
  check('new asset appeared in grid', finalCount > initialAssetCount, `${initialAssetCount} → ${finalCount}`);

  // Find the card matching our prompt
  const newCard = page.locator('.grid > div', { hasText: PROMPT }).first();
  const cardExists = await newCard.count() > 0;
  check('new card matches prompt', cardExists);

  // Preview Slides — only present if latest_payload.slides exists. OpenMAIC
  // path saves only {openmaicClassroomId, prompt}, so this button is hidden
  // for OpenMAIC generations (that's by design). Just note presence.
  const previewBtn = newCard.locator('button:has-text("Preview Slides")');
  const previewPresent = await previewBtn.count() > 0;
  console.log(`   Preview Slides button: ${previewPresent ? 'present' : 'absent (expected for OpenMAIC)'}`);

  // Enter Classroom — should be present for OpenMAIC assets.
  const enterLink = newCard.locator('a:has-text("Enter Classroom")');
  const enterPresent = await enterLink.count() > 0;
  check('Enter Classroom link present on new card', enterPresent);

  if (enterPresent) {
    const href = await enterLink.first().getAttribute('href');
    console.log(`   Enter Classroom href: ${href}`);
    check('Enter Classroom URL is well-formed', /^https?:\/\/[^/]+\/classroom\/[A-Za-z0-9_-]+/.test(href || ''), href || '');

    // Verify the redirect actually navigates somewhere. Block the core request
    // so the test doesn't hang on a real classroom page; we just want to know
    // the navigation succeeds.
    console.log('6. Verify Enter Classroom navigates (intercepted)');
    let popupUrl = null;
    ctx.on('page', (p) => { popupUrl = p.url(); });
    // Intercept any navigation to core and short-circuit so we don't wait on
    // the real classroom UI.
    await page.route('**/classroom/**', (route) => {
      popupUrl = route.request().url();
      return route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>classroom stub</body></html>' });
    });
    const [popup] = await Promise.all([
      ctx.waitForEvent('page', { timeout: 10000 }).catch(() => null),
      enterLink.first().click({ modifiers: [] }),
    ]);
    await page.waitForTimeout(1000);
    const navigated = popupUrl ?? (popup ? popup.url() : null);
    console.log(`   popup/navigation url: ${navigated}`);
    check('clicking Enter Classroom triggers navigation', !!navigated, navigated || 'no popup');
    check('navigation lands on a /classroom/ URL', /\/(classroom|core\/classroom)\//.test(navigated || ''), navigated || '');
  }

  console.log('7. Verify Delete button works');
  page.once('dialog', (d) => d.accept());
  const deleteBtn = newCard.locator('button:has-text("Delete")');
  const deletePresent = await deleteBtn.count() > 0;
  check('Delete button present on new card', deletePresent);
  if (deletePresent) {
    await deleteBtn.click();
    await page.waitForTimeout(2000);
    const afterDeleteCount = await page.locator('.grid > div').count();
    check('asset removed after Delete', afterDeleteCount === finalCount - 1, `${finalCount} → ${afterDeleteCount}`);
  }

  await page.screenshot({ path: '/tmp/teacher-smoke-final.png', fullPage: true });
  console.log('\nFinal screenshot: /tmp/teacher-smoke-final.png');
} catch (err) {
  console.error('UNEXPECTED ERROR:', err.message);
  await page.screenshot({ path: '/tmp/teacher-smoke-error.png', fullPage: true }).catch(() => {});
  failures.push('uncaught exception: ' + err.message);
} finally {
  await browser.close();
  console.log('\n=== Summary ===');
  if (failures.length === 0) {
    console.log('All checks passed.');
    process.exit(0);
  } else {
    console.log('Failed checks:');
    for (const f of failures) console.log('  - ' + f);
    process.exit(1);
  }
}