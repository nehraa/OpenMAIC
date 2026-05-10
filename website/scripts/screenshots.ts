import { chromium, devices } from 'playwright';

const PAGES = [
  { name: 'landing', url: 'http://localhost:3001' },
  { name: 'login-teacher', url: 'http://localhost:3001/login/teacher' },
  { name: 'login-student', url: 'http://localhost:3001/login/student' },
  { name: 'login-individual', url: 'http://localhost:3001/login/individual' },
  { name: 'dashboard-teacher', url: 'http://localhost:3001/dashboard/teacher' },
  { name: 'dashboard-student', url: 'http://localhost:3001/dashboard/student' },
  { name: 'classroom', url: 'http://localhost:3001/classroom/demo-001' },
];

const OUTPUT_DIR = './screenshots';

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  for (const page of PAGES) {
    const tab = await context.newPage();
    console.log(`📸 Capturing ${page.name}...`);

    try {
      await tab.goto(page.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await tab.waitForTimeout(2000); // let animations settle

      const screenshot = await tab.screenshot({
        fullPage: true,
        type: 'png',
      });

      const fs = await import('fs');
      if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      }
      fs.writeFileSync(`${OUTPUT_DIR}/${page.name}.png`, screenshot);
      console.log(`  ✓ Saved ${page.name}.png`);
    } catch (err) {
      console.error(`  ✗ Failed ${page.name}: ${(err as Error).message}`);
    }

    await tab.close();
  }

  await browser.close();
  console.log('\n✅ All screenshots captured!');
}

captureScreenshots().catch(console.error);