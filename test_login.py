from playwright.sync_api import sync_playwright

def test_login():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Listen for console errors
        def on_console(msg):
            if msg.type == 'error':
                print(f'Console error: {msg.text}')

        page.on('console', on_console)

        def on_page_error(err):
            print(f'Page error: {err}')

        page.on('pageerror', on_page_error)

        try:
            # Go to landing page
            print('1. Going to landing page...')
            page.goto('http://localhost:3001', wait_until='networkidle')
            url = page.url
            print(f'   Landing page loaded: {url}')

            # Click Teacher button (button containing text Teacher)
            print('2. Clicking Teacher button...')
            page.get_by_role('button', name='Teacher').click()
            page.wait_for_url('**/login**')
            url = page.url
            print(f'   Navigated to: {url}')

            # Fill in login form
            print('3. Filling login form...')
            page.fill('#email', 'test@example.com')
            page.fill('#password', 'password123')

            # Submit
            print('4. Submitting login...')
            page.click('button[type="submit"]')

            # Wait for navigation
            page.wait_for_timeout(3000)

            url = page.url
            print(f'   Current URL: {url}')

            if '/teacher' in url:
                print('5. SUCCESS - At teacher dashboard')
                content = page.text_content('body')
                if 'Loading' in content:
                    print('   Dashboard showing Loading state')
                if 'Unable to load' in content:
                    print('   Dashboard showing error state')
            else:
                print('5. NOT at teacher dashboard')
                content = page.text_content('body')[:500]
                print(f'   Page content preview: {content}')

        except Exception as err:
            print(f'Test error: {err}')
            import traceback
            traceback.print_exc()
        finally:
            browser.close()

if __name__ == '__main__':
    test_login()