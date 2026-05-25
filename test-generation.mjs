import { chromium } from 'playwright';

async function runTest() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('=== STEP 1: Login to Teacher App ===');
  await page.goto('http://localhost:3004/teacher');
  await page.waitForLoadState('networkidle').catch(() => {});
  
  // Check for login form
  const emailInput = page.locator('input[type="email"]');
  if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await emailInput.fill('teacher@test.com');
    await page.locator('input[type="password"]').fill('Test123!');
    await page.locator('button[type="submit"]').click();
    await page.waitForLoadState('networkidle').catch(() => {});
  }
  
  // OTP login if needed
  const phoneInput = page.locator('input[type="tel"]');
  if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('Using OTP login...');
    await phoneInput.fill('+15559000001');
    await page.locator('button[type="submit"]').click();
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
    }
    await page.locator('button:has-text("Verify")').click();
    await page.waitForLoadState('networkidle').catch(() => {});
  }
  
  console.log('Logged in. Session:', await page.evaluate(() => localStorage.getItem('session_id') ? 'SET' : 'NOT SET'));
  
  console.log('\n=== STEP 2: Navigate to Library ===');
  await page.goto('http://localhost:3004/teacher/library');
  await page.waitForLoadState('networkidle').catch(() => {});
  console.log('Current URL:', page.url());
  
  console.log('\n=== STEP 3: Open Generate Modal ===');
  const generateBtn = page.locator('button:has-text("Generate")').first();
  if (await generateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await generateBtn.click();
    await page.waitForTimeout(500);
    
    console.log('\n=== STEP 4: Generate Slides ===');
    const promptInput = page.locator('textarea, input[type="text"]').first();
    if (await promptInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await promptInput.fill('Introduction to Photosynthesis for 5th Graders');
      
      const generateBtn2 = page.locator('button:has-text("Generate")').last();
      await generateBtn2.click();
      
      console.log('Waiting for generation (up to 90 seconds)...');
      
      // Wait for result
      try {
        await page.waitForFunction(() => {
          const text = document.body.innerText;
          return text.includes('Generation Complete') || 
                 text.includes('demo content') || 
                 text.includes('slides are ready') ||
                 text.includes('Enter Classroom');
        }, { timeout: 90000 });
        
        const result = await page.evaluate(() => document.body.innerText);
        console.log('\nGeneration result snippet:');
        console.log(result.substring(0, 800));
      } catch (e) {
        console.log('Timeout waiting for generation result');
        const result = await page.evaluate(() => document.body.innerText);
        console.log(result.substring(0, 500));
      }
      
      // Check for Enter Classroom button
      const enterBtn = page.locator('a:has-text("Enter Classroom"), button:has-text("Enter Classroom")').first();
      const enterBtnVisible = await enterBtn.isVisible({ timeout: 2000 }).catch(() => false);
      console.log('\n"Enter Classroom" button visible:', enterBtnVisible);
      
      if (enterBtnVisible) {
        const href = await enterBtn.getAttribute('href');
        console.log('Enter Classroom URL:', href);
      }
    }
  } else {
    console.log('Generate button not found');
    console.log('Page content:', await page.content());
  }
  
  await browser.close();
  console.log('\n=== Test Complete ===');
}

runTest().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
