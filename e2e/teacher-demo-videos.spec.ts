/**
 * Teacher Demo Video Recording
 * Records 3 videos demonstrating the teacher app flows:
 * 1. Create assignment with AI slide/quiz generation via Library
 * 2. View student progress across all students
 * 3. View individual student details in progress
 */

import { test, expect, Page } from '@playwright/test';

const APP_URL = 'http://localhost:3001';
const TEACHER_EMAIL = 'demo@aidu.tech';
const TEACHER_PASSWORD = 'Demo2024!';

test.describe.configure({ mode: 'serial' });

// Helper function to login via API and set session
async function teacherLogin(page: Page) {
  // First navigate to the app to establish a secure context
  await page.goto(`${APP_URL}/login/teacher`);
  await page.waitForLoadState('domcontentloaded');

  // Retry login up to 3 times if rate limited
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
      console.log(`Rate limited (attempt ${attempt}), waiting 2 seconds...`);
      await page.waitForTimeout(2000);
    } else if (!response.ok()) {
      break;
    }
  }

  if (!response || !response.ok()) {
    throw new Error(`Login failed: ${response?.status() || 'unknown'}`);
  }

  const data = await response.json();
  const { access_token, refresh_token, user } = data;

  // Set tokens in localStorage for the teacher app to find
  await page.evaluate((tokens) => {
    localStorage.setItem('session_id', tokens.access_token);
    localStorage.setItem('user', JSON.stringify(tokens.user));
  }, { access_token, refresh_token, user });

  console.log(`Logged in as ${user.email}`);
  return user;
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
});

test('Video 1: Create assignment with AI slide generation via Library', async ({ page }) => {
  const videoPath = '/Users/abhinavnehra/Desktop/video1_create_assignment.webm';
  const videoDir = '/Users/abhinavnehra/Desktop';

  console.log('=== VIDEO 1: Create Assignment with AI Generation ===');

  // Login
  await teacherLogin(page);

  // Navigate to teacher app and verify login worked
  await page.goto(`${APP_URL}/teacher/library`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  console.log('Navigated to Library');

  // Take screenshot
  await page.screenshot({ path: `${videoDir}/video1_step1_library.png` });

  // Click "Generate with AI"
  await page.click('text=Generate with AI');
  await page.waitForTimeout(500);
  console.log('Opened Generate with AI modal');

  // Select Slide Deck type
  await page.click('button:has-text("Slide Deck")');
  await page.waitForTimeout(300);

  // Enter prompt
  const textarea = page.locator('textarea');
  await textarea.fill('Introduction to Algebra for 8th Grade - covering variables, expressions, and linear equations');
  console.log('Entered prompt for slide generation');

  // Take screenshot before generating
  await page.screenshot({ path: `${videoDir}/video1_step2_enter_prompt.png` });

  // Click Generate
  await page.click('button:has-text("Generate Now")');

  // Wait for mock generation (2+ seconds)
  await page.waitForTimeout(3500);
  console.log('Generated slides (mock)');

  // Take screenshot after generation
  await page.screenshot({ path: `${videoDir}/video1_step3_generated.png` });

  // Go back to library to use the asset
  await page.goto(`${APP_URL}/teacher/library`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  console.log('Back in library');

  // Check if we're actually logged in by looking for assets or login redirect
  const pageContent = await page.content();
  if (pageContent.includes('Login') && pageContent.includes('email')) {
    console.log('ERROR: Not logged in - page shows login form');
  }

  // Click "Use" on the first asset
  const useButton = page.locator('button:has-text("Use")').first();
  const useButtonExists = await useButton.isVisible().catch(() => false);

  if (useButtonExists) {
    await useButton.click();
    await page.waitForTimeout(1000);
    console.log('Opened Use modal');

    // Wait for the modal to fully render
    await page.waitForSelector('text=Create Assignment from', { state: 'visible' });

    // Select the class using proper React-compatible selection
    const formSelect = page.locator('form select').first();
    await formSelect.waitFor({ state: 'visible' });

    // Select by label that matches class name
    await formSelect.selectOption({ label: 'Class 10 Mathematics' });
    await page.waitForTimeout(1500);

    // Take screenshot of form
    await page.screenshot({ path: `${videoDir}/video1_step4_use_modal.png` });

    // Check if button is enabled
    const createBtn = page.locator('button:has-text("Create Assignment")');
    const isDisabled = await createBtn.isDisabled();
    console.log(`Create Assignment button disabled: ${isDisabled}`);

    // Force click
    await createBtn.click({ force: true });
    await page.waitForTimeout(2000);
    console.log('Clicked Create Assignment');
  } else {
    console.log('No assets to use - checking if login worked');
    await page.screenshot({ path: `${videoDir}/video1_step4_no_assets.png` });
  }

  // Take final screenshot
  await page.screenshot({ path: `${videoDir}/video1_step5_final.png` });

  console.log('Video 1 complete!');
});

test('Video 2: View student progress across all students', async ({ page }) => {
  const videoDir = '/Users/abhinavnehra/Desktop';

  console.log('\n=== VIDEO 2: View Student Progress ===');

  // Login
  await teacherLogin(page);

  // Navigate to Progress
  await page.goto(`${APP_URL}/teacher/progress`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  console.log('Navigated to Progress page');

  // Take screenshot of progress page
  await page.screenshot({ path: `${videoDir}/video2_step1_progress.png` });

  // Wait for class dropdown to have options
  const classSelect = page.locator('select').first();
  await classSelect.waitFor({ state: 'visible' });
  await page.waitForTimeout(1000);

  // Select first class in dropdown if options exist
  const options = await classSelect.locator('option').all();
  if (options.length > 1) {
    await classSelect.selectOption({ index: 1 });
    await page.waitForTimeout(2000);
    console.log('Selected class');
  }

  // Take screenshot with class selected
  await page.screenshot({ path: `${videoDir}/video2_step2_with_class.png` });

  // Try filtering by Low Score
  const lowScoreBtn = page.locator('text=Low Score').first();
  const lowScoreExists = await lowScoreBtn.isVisible().catch(() => false);
  if (lowScoreExists) {
    await lowScoreBtn.click();
    await page.waitForTimeout(1000);
    console.log('Applied Low Score filter');
    await page.screenshot({ path: `${videoDir}/video2_step3_low_score_filter.png` });
  }

  console.log('Video 2 complete!');
});

test('Video 3: View individual student details', async ({ page }) => {
  const videoDir = '/Users/abhinavnehra/Desktop';

  console.log('\n=== VIDEO 3: Individual Student View ===');

  // Login
  await teacherLogin(page);

  // Navigate to Progress
  await page.goto(`${APP_URL}/teacher/progress`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Wait for class dropdown to have options
  const classSelect = page.locator('select').first();
  await classSelect.waitFor({ state: 'visible' });
  await page.waitForTimeout(1000);

  // Select first class if options exist
  const options = await classSelect.locator('option').all();
  if (options.length > 1) {
    await classSelect.selectOption({ index: 1 });
    await page.waitForTimeout(2000);
  }

  // Take screenshot before expanding
  await page.screenshot({ path: `${videoDir}/video3_step1_before_expand.png` });

  // Click on first student row to expand details
  const firstRow = page.locator('table tbody tr').first();
  const rowExists = await firstRow.isVisible().catch(() => false);

  if (rowExists) {
    await firstRow.click();
    await page.waitForTimeout(1500);
    console.log('Expanded student row');

    // Take screenshot with expanded details
    await page.screenshot({ path: `${videoDir}/video3_step2_expanded.png` });
  } else {
    console.log('No student rows found');
  }

  console.log('Video 3 complete!');
});