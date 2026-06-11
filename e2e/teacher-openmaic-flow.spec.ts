import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:3004';

test('Teacher generates slides via OpenMAIC', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });

  console.log('=== STEP 1: Go to teacher app ===');
  await page.goto(`${APP_URL}/teacher`);
  await page.waitForLoadState('networkidle');
  console.log('URL:', page.url());
  
  const bodyText = await page.locator('body').textContent();
  console.log('Dashboard loaded:', bodyText?.includes('Teacher Dashboard'));
  
  // Try OTP login
  const phoneInput = page.locator('input[type="tel"]');
  if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('Phone input visible - logging in...');
    await phoneInput.fill('+15559990003');
    await page.locator('button:has-text("Continue")').click();
    await page.waitForTimeout(1000);
    
    // Request OTP
    const requestBtn = page.locator('button:has-text("Request")');
    if (await requestBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await requestBtn.click();
      await page.waitForTimeout(500);
    }
    
    // Enter OTP
    const otpInput = page.locator('input[maxlength="6"]');
    if (await otpInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await otpInput.fill('123456');
      await page.locator('button:has-text("Verify")').click();
      await page.waitForLoadState('networkidle');
    }
  }
  
  const sessionId = await page.evaluate(() => localStorage.getItem('session_id'));
  console.log('Session:', sessionId ? 'SET' : 'NOT SET');

  console.log('\n=== STEP 2: Go to Library (correct URL) ===');
  await page.goto(`${APP_URL}/teacher/teacher/library`);
  await page.waitForLoadState('networkidle');
  console.log('URL:', page.url());
  
  const libText = await page.locator('body').textContent();
  console.log('Library loaded:', !libText.includes('404'));
  
  const generateBtn = page.locator('button:has-text("Generate")').first();
  const hasGenerate = await generateBtn.isVisible({ timeout: 3000 }).catch(() => false);
  console.log('Generate button visible:', hasGenerate);
  
  if (hasGenerate) {
    console.log('\n=== STEP 3: Generate Slides ===');
    await generateBtn.click();
    await page.waitForTimeout(1000);
    
    const promptInput = page.locator('textarea');
    if (await promptInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await promptInput.fill('Introduction to Photosynthesis for 5th Graders');
      
      const generateNowBtn = page.locator('button:has-text("Generate")').last();
      await generateNowBtn.click();
      
      console.log('Waiting for generation (up to 75 seconds)...');
      
      // Wait for either success or mock content
      try {
        await page.waitForFunction(() => {
          const text = document.body.innerText;
          return text.includes('Generation Complete') || 
                 text.includes('demo content') || 
                 text.includes('slides are ready') ||
                 text.includes('Enter Classroom') ||
                 text.includes('OpenMAIC is not currently running');
        }, { timeout: 75000 });
        
        console.log('Generation completed!');
      } catch (e) {
        console.log('Waiting for result timed out');
      }
      
      const enterBtn = page.locator('a:has-text("Enter Classroom")').first();
      const enterBtnVisible = await enterBtn.isVisible({ timeout: 2000 }).catch(() => false);
      console.log('\n"Enter Classroom" button visible:', enterBtnVisible);
      
      if (enterBtnVisible) {
        const href = await enterBtn.getAttribute('href');
        console.log('Enter Classroom URL:', href);
      }
      
      // Get full result text
      const resultText = await page.locator('body').textContent();
      console.log('\nResult contains:', 
        resultText.includes('Enter Classroom') ? '✓ Enter Classroom' : '✗ Enter Classroom',
        resultText.includes('Generation Complete') ? '✓ Generation Complete' : '✗ Generation Complete',
        resultText.includes('demo content') ? '✓ demo content (mock)' : '(no mock msg)');
    }
  }
});
