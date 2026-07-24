// End-to-end browser test: verifies that the lazy Preview Slides fetch works
// for a real OpenMAIC asset whose payload only carries openmaicClassroomId
// (no slides array). Asserts the modal renders the deck by hitting Core.

import pkg from '/home/Hermes/repos/OpenMAIC/teacher/node_modules/pg/lib/index.js';
import { chromium } from '/home/Hermes/repos/OpenMAIC/node_modules/.pnpm/playwright@1.59.1/node_modules/playwright/index.mjs';

const TEACHER_URL = 'http://localhost:3002/teacher';
const EMAIL = 'smoke.teacher@test.local';
const PASSWORD = 'SmokeTest2024!';

const failures = [];
const check = (name, ok, detail = '') => {
  const status = ok ? 'PASS' : 'FAIL';
  console.log(`  [${status}] ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures.push(name);
};

const { Client } = pkg;
const db = new Client({ host: '127.0.0.1', port: 5433, user: 'postgres', database: 'postgres' });
await db.connect();
const rows = await db.query(
  `SELECT ca.id, ca.title, v.payload_json
     FROM content_assets ca
     LEFT JOIN content_asset_versions v ON v.asset_id = ca.id
     WHERE ca.owner_teacher_id = (SELECT id FROM users WHERE email = 'smoke.teacher@test.local')
       AND ca.source_ref LIKE 'openmaic:%'
       AND ca.source_ref <> 'openmaic:seed-stub'
     ORDER BY ca.created_at DESC, v.version_number DESC LIMIT 5`
);
if (rows.rows.length === 0) {
  console.error('No real OpenMAIC asset found. Run a generation or seed one.');
  process.exit(1);
}

const target = rows.rows.find((r) => {
  const p = JSON.parse(r.payload_json || '{}');
  return p.openmaicClassroomId && (!Array.isArray(p.slides) || p.slides.length === 0);
});
if (!target) {
  console.error('All OpenMAIC assets already have slides cached.');
  process.exit(1);
}
const assetId = target.id;
const title = target.title;
const payload = JSON.parse(target.payload_json);
const classroomId = payload.openmaicClassroomId;
console.log(`Target asset ${assetId} classroomId=${classroomId} title="${title.slice(0, 40)}"`);

// Pre-flight: confirm Core can return the classroom before we open the browser.
const coreRes = await fetch(`http://127.0.0.1:3003/api/classroom?id=${classroomId}`);
check('Core has the classroom', coreRes.ok, `HTTP ${coreRes.status}`);
const coreJson = await coreRes.json();
const coreClassroom = coreJson?.data?.classroom ?? coreJson?.classroom;
const sceneCount = coreClassroom?.scenes?.length ?? 0;
check('Core classroom has scenes', sceneCount > 0, `${sceneCount} scenes`);

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

try {
  console.log('Login');
  await page.goto(`${TEACHER_URL}/login/teacher`, { waitUntil: 'domcontentloaded' });
  await page.fill('#email', EMAIL);
  await page.fill('#password', PASSWORD);
  await Promise.all([
    page.waitForURL((url) => /\/teacher($|\/)/.test(url.pathname) && !url.pathname.includes('/login'), { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);

  console.log('Open library');
  await page.goto(`${TEACHER_URL}/teacher/library`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="generate-openmaic-classroom"]', { timeout: 10000 });

  console.log('Find target asset');
  const card = page.locator(`.grid > div:has-text(${JSON.stringify(title)})`).first();
  await card.waitFor({ timeout: 10000 });
  check('asset card rendered', await card.count() > 0);

  const previewBtn = card.locator('button:has-text("Preview Slides")');
  check('Preview Slides button visible (lazy)', await previewBtn.count() > 0);

  console.log('Click Preview Slides');
  await previewBtn.click();

  console.log('Wait for modal to load slides');
  await page.waitForSelector('text=Fetching deck from OpenMAIC', { timeout: 5000 }).catch(() => {});
  // Either the loading state, error, or slides. Wait for one of those to settle.
  await page.waitForFunction(
    () => !document.body.innerText.includes('Fetching deck from OpenMAIC'),
    null,
    { timeout: 30000 }
  );

  const errorVisible = await page.locator('text=Failed to load').count() > 0
    || await page.locator('text=Classroom fetch failed').count() > 0;
  check('no error in modal', !errorVisible);

  const slideLabels = await page.locator('text=/^Slide \\d+$/').count();
  check('slide labels rendered', slideLabels > 0, `${slideLabels} slides`);

  // Match by expected scene count from Core.
  check('slide count matches Core scenes', slideLabels === sceneCount, `modal=${slideLabels} core=${sceneCount}`);

  await page.screenshot({ path: '/tmp/preview-lazy-success.png', fullPage: true });
  console.log('Screenshot: /tmp/preview-lazy-success.png');
} catch (err) {
  console.error('Test threw:', err);
  await page.screenshot({ path: '/tmp/preview-lazy-failure.png', fullPage: true });
  failures.push('uncaught');
} finally {
  await browser.close();
  await db.end();
}

if (failures.length > 0) {
  console.log(`\n${failures.length} FAIL: ${failures.join(', ')}`);
  process.exit(1);
}
console.log('\nAll checks passed.');