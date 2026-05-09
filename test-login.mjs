import { chromium } from 'playwright';

async function testLogin() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('Page error:', err.message);
  });

  try {
    // Go to landing page
    console.log('1. Going to landing page...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    console.log('   Landing page loaded');

    // Click Teacher button
    console.log('2. Clicking Teacher button...');
    await page.click('text=Teacher');
    await page.waitForURL('**/login**');
    console.log('   Navigated to login page');

    // Fill in login form
    console.log('3. Filling login form...');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');

    // Submit
    console.log('4. Submitting login...');
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForTimeout(2000);

    const url = page.url();
    console.log('   Current URL:', url);

    if (url.includes('/teacher')) {
      console.log('5. SUCCESS - Logged in and at teacher dashboard');
      // Check what errors appear on the dashboard
      const content = await page.textContent('body');
      if (content.includes('Loading')) {
        console.log('   Dashboard showing Loading... state');
      }
      if (content.includes('Unable to load')) {
        console.log('   Dashboard showing error state');
      }
    } else {
      console.log('5. FAILED - Not at teacher dashboard');
    }

  } catch (err) {
    console.log('Test error:', err.message);
  } finally {
    await browser.close();
  }
}

testLogin();