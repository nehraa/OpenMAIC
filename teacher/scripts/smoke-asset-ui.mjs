// End-to-end browser test: verify the library page renders an OpenMAIC
// classroom asset with the Use / Preview Slides / Enter Classroom / Delete
// buttons, that the Enter Classroom link points to the right URL, and that
// Delete actually removes the asset.
//
// Run with: node /home/Hermes/repos/OpenMAIC/teacher/scripts/smoke-asset-ui.mjs
//
// Pre-reqs:
//   - teacher dev server on :3002
//   - core dev server on :3003 (used only for URL composition)
//   - a seeded asset row in content_assets for smoke.teacher@test.local
//     (run /tmp/seed-stub-asset.mjs first)

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
const seed = await db.query(
  `SELECT ca.id, ca.title, v.payload_json
     FROM content_assets ca
     LEFT JOIN content_asset_versions v ON v.asset_id = ca.id
     WHERE ca.owner_teacher_id = (SELECT id FROM users WHERE email = 'smoke.teacher@test.local')
       AND ca.source_ref = 'openmaic:seed-stub'
     ORDER BY ca.created_at DESC, v.version_number DESC LIMIT 1`
);
if (seed.rows.length === 0) {
  console.error('No seeded asset found. Run /tmp/seed-stub-asset.mjs first.');
  process.exit(1);
}
await db.end();
const seededAssetId = seed.rows[0].id;
const seedTitle = seed.rows[0].title;
const payload = JSON.parse(seed.rows[0].payload_json || '{}');
const classroomId = payload.openmaicClassroomId;
console.log(`Found seeded asset ${seededAssetId} with classroomId ${classroomId} title="${seedTitle}"`);

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

try {
  console.log('1. Login');
  await page.goto(`${TEACHER_URL}/login/teacher`, { waitUntil: 'domcontentloaded' });
  await page.fill('#email', EMAIL);
  await page.fill('#password', PASSWORD);
  await Promise.all([
    page.waitForURL((url) => /\/teacher($|\/)/.test(url.pathname) && !url.pathname.includes('/login'), { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);
  check('login redirects to /teacher', !page.url().includes('/login'));

  console.log('2. Navigate to library');
  await page.goto(`${TEACHER_URL}/teacher/library`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="generate-openmaic-classroom"]', { timeout: 10000 });
  check('library page loaded with Generate OpenMAIC Classroom button', true);

  console.log('3. Locate seeded asset');
  // Use the exact title (which has a unique HH:MM:SS suffix) so we don't pick
  // up sibling seeds from earlier runs.
  const card = page.locator(`.grid > div:has-text(${JSON.stringify(seedTitle)})`).first();
  await card.waitFor({ timeout: 10000 });
  check(`seeded asset card "${seedTitle.slice(0, 40)}..." rendered`, await card.count() > 0);

  console.log('4. Verify all four control buttons');
  const useBtn = card.locator('button:has-text("Use")');
  const previewBtn = card.locator('button:has-text("Preview Slides")');
  const enterLink = card.locator('[data-testid="enter-classroom"]');
  const deleteBtn = card.locator('button[aria-label="Delete asset"]');

  check('Use button rendered', await useBtn.count() > 0);
  check('Preview Slides button rendered (asset has slides)', await previewBtn.count() > 0);
  check('Enter Classroom link rendered (asset has openmaicClassroomId)', await enterLink.count() > 0);
  check('Delete button rendered', await deleteBtn.count() > 0);

  console.log('5. Verify Enter Classroom URL');
  const href = await enterLink.first().getAttribute('href');
  const target = await enterLink.first().getAttribute('target');
  const expectedPrefix = 'http://127.0.0.1:3003/classroom/';
  check('Enter Classroom href points to /classroom/<id> on core', href?.startsWith(expectedPrefix), href || '(empty)');
  check(`href ends with seeded classroomId`, href?.endsWith(classroomId), `expected suffix ${classroomId}, got ${href}`);
  check('Enter Classroom opens in new tab', target === '_blank');

  console.log('6. Click Preview Slides modal');
  await previewBtn.first().click();
  const modal = page.locator(`h2:has-text(${JSON.stringify(seedTitle)})`);
  await modal.waitFor({ timeout: 5000 });
  check('preview modal opened', await modal.count() > 0);
  const slideCount = await page.locator('span:has-text("Slide 1")').count();
  check('preview shows slide 1', slideCount > 0);
  const slide3 = await page.locator('h3:has-text("Inputs and Outputs")').count();
  check('preview shows slide 3 content', slide3 > 0);
  // Close modal
  await page.locator('button[aria-label="Close"]').first().click();

  console.log('7. Click Delete and confirm removal');
  page.once('dialog', (d) => d.accept());
  await deleteBtn.first().click();
  await page.waitForTimeout(2000);
  // After delete, that specific asset card should be gone
  const stillThere = await page.locator(`.grid > div:has-text(${JSON.stringify(seedTitle)})`).count();
  check('seeded asset removed after Delete', stillThere === 0, `remaining matches: ${stillThere}`);

  await page.screenshot({ path: '/tmp/smoke-asset-ui-final.png', fullPage: true });
  console.log('\nFinal screenshot: /tmp/smoke-asset-ui-final.png');
} catch (err) {
  console.error('UNEXPECTED ERROR:', err.message);
  await page.screenshot({ path: '/tmp/smoke-asset-ui-error.png', fullPage: true }).catch(() => {});
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
