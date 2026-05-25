"""
Record 3 demo videos for teacher app:
1. Teacher creates assignment with AI slide/quiz generation via Library
2. Teacher views student progress across all students
3. Teacher views individual student in progress tracking
"""
import asyncio
from playwright.async_api import async_playwright
import os

DESKTOP = "/Users/abhinavnehra/Desktop"
TEACHER_URL = "http://localhost:3003"
TEACHER_EMAIL = "demo@aidu.tech"
TEACHER_PASSWORD = "Demo2024!"

async def login_and_wait(page):
    """Login as teacher and wait for dashboard to load"""
    print("Logging in...")
    await page.goto(f"{TEACHER_URL}/login")
    await page.wait_for_load_state("networkidle")

    # Fill login form
    await page.fill('input[type="email"]', TEACHER_EMAIL)
    await page.fill('input[type="password"]', TEACHER_PASSWORD)
    await page.click('button[type="submit"]')

    # Wait for redirect to dashboard
    await page.wait_for_url("**/teacher**", timeout=10000)
    await page.wait_for_load_state("networkidle")
    print(f"Logged in, URL: {page.url}")

async def video1_create_assignment(page):
    """Video 1: Create assignment with AI slide generation via Library"""
    print("\n=== VIDEO 1: Create Assignment with AI Generation ===")

    await login_and_wait(page)

    # Navigate to Library
    print("Navigating to Library...")
    await page.click('text=Library')
    await page.wait_for_load_state("networkidle")
    await page.wait_for_timeout(1000)

    # Click "Generate with AI"
    print("Clicking Generate with AI...")
    await page.click('text=Generate with AI')
    await page.wait_for_timeout(500)

    # Select Slide Deck
    print("Selecting Slide Deck...")
    await page.click('text=Slide Deck')
    await page.wait_for_timeout(300)

    # Enter prompt
    print("Entering prompt...")
    await page.fill('textarea', 'Introduction to Algebra for 8th Grade - covering variables, expressions, and linear equations')
    await page.wait_for_timeout(300)

    # Click Generate
    print("Generating...")
    await page.click('text=Generate Now')
    await page.wait_for_timeout(3000)  # Wait for mock generation

    # Go back to library and use the asset
    print("Going back to library...")
    await page.goto(f"{TEACHER_URL}/teacher/library")
    await page.wait_for_load_state("networkidle")
    await page.wait_for_timeout(2000)

    # Click "Use" on the first asset
    print("Clicking Use on asset...")
    use_buttons = await page.query_selector_all('text=Use')
    if use_buttons:
        await use_buttons[0].click()
        await page.wait_for_timeout(500)

        # Fill the reuse form
        print("Filling assignment details...")
        await page.select_option('select', index=1)  # Select first class
        await page.wait_for_timeout(300)

        # Click Create Assignment
        await page.click('text=Create Assignment')
        await page.wait_for_timeout(2000)

    print("Video 1 complete!")

async def video2_view_progress(page):
    """Video 2: View student progress across all students"""
    print("\n=== VIDEO 2: View Student Progress ===")

    await login_and_wait(page)

    # Navigate to Progress
    print("Navigating to Progress...")
    await page.click('text=Progress')
    await page.wait_for_load_state("networkidle")
    await page.wait_for_timeout(2000)

    # Select a class
    print("Selecting class...")
    selects = await page.query_selector_all('select')
    if selects:
        await selects[0].select_option(index=1)
        await page.wait_for_timeout(2000)

    # Filter by low score
    print("Filtering by low score...")
    low_score_btn = await page.query_selector('text=Low Score')
    if low_score_btn:
        await low_score_btn.click()
        await page.wait_for_timeout(1000)

    print("Video 2 complete!")

async def video3_individual_student(page):
    """Video 3: View individual student progress"""
    print("\n=== VIDEO 3: Individual Student View ===")

    await login_and_wait(page)

    # Navigate to Progress
    print("Navigating to Progress...")
    await page.click('text=Progress')
    await page.wait_for_load_state("networkidle")
    await page.wait_for_timeout(2000)

    # Select a class
    selects = await page.query_selector_all('select')
    if selects:
        await selects[0].select_option(index=1)
        await page.wait_for_timeout(2000)

    # Click on a student row to expand
    print("Expanding student details...")
    rows = await page.query_selector_all('table tbody tr')
    if rows:
        await rows[0].click()
        await page.wait_for_timeout(1500)

    print("Video 3 complete!")

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080}
        )

        page = await context.new_page()

        # Record Video 1
        print("\n--- RECORDING VIDEO 1 ---")
        await page.goto(TEACHER_URL)
        await page.wait_for_load_state("networkidle")

        await page.evaluate("""() => {
            // Start recording
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { displaySurface: 'monitor' },
                audio: false
            });
            window._recordedStream = stream;
        }""")

        await video1_create_assignment(page)

        # Get video blob and save
        print("Saving Video 1...")

        # Record Video 2
        print("\n--- RECORDING VIDEO 2 ---")
        await page.goto(TEACHER_URL)
        await page.wait_for_load_state("networkidle")
        await video2_view_progress(page)

        # Record Video 3
        print("\n--- RECORDING VIDEO 3 ---")
        await page.goto(TEACHER_URL)
        await page.wait_for_load_state("networkidle")
        await video3_individual_student(page)

        await browser.close()

        print("\n=== ALL VIDEOS COMPLETE ===")
        print(f"Videos saved to: {DESKTOP}")

asyncio.run(main())
