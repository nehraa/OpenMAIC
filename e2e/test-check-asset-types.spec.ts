import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:3001';
const TEACHER_EMAIL = 'demo@aidu.tech';
const TEACHER_PASSWORD = 'Demo2024!';

test('Debug asset types', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });

  // Login via API
  let response;
  for (let attempt = 1; attempt <= 3; attempt++) {
    response = await page.request.post(`${APP_URL}/api/auth/login`, {
      data: {
        email: TEACHER_EMAIL,
        password: TEACHER_PASSWORD
      }
    });
    if (response.ok()) break;
    if (response.status() === 429 && attempt < 3) {
      await page.waitForTimeout(2000);
    } else {
      break;
    }
  }

  const data = await response.json();
  const { access_token, refresh_token, user } = data;

  // Set tokens in localStorage BEFORE navigating
  await page.goto(`${APP_URL}/login/teacher`);
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate((tokens) => {
    localStorage.setItem('session_id', tokens.access_token);
    localStorage.setItem('user', JSON.stringify(tokens.user));
  }, { access_token, refresh_token, user });
  
  console.log('Session set, navigating to library...');

  // Navigate to Library and wait
  await page.goto(`${APP_URL}/teacher/library`, { waitUntil: 'networkidle' });
  
  // Check session is set
  const sessionCheck = await page.evaluate(() => localStorage.getItem('session_id'));
  console.log('Session after navigation:', sessionCheck ? 'SET' : 'NOT SET');

  // Make API call to get assets
  const apiResult = await page.evaluate(async () => {
    const sessionId = localStorage.getItem('session_id');
    console.log('Making API call with session:', sessionId?.substring(0, 10));
    const res = await fetch('/teacher/api/teacher/library/assets?type=slide_deck', {
      headers: { 'x-session-id': sessionId || '' }
    });
    console.log('API response status:', res.status);
    const text = await res.text();
    console.log('API response (first 200):', text.substring(0, 200));
    try {
      const json = JSON.parse(text);
      return {
        status: res.status,
        total: json.total,
        types: json.assets?.map((a: any) => a.type).slice(0, 5)
      };
    } catch (e) {
      return { error: text.substring(0, 200) };
    }
  });
  console.log('API result:', JSON.stringify(apiResult));
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/test-asset-types.png', fullPage: true });
});
