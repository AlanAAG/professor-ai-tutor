from playwright.sync_api import Page, expect, sync_playwright

def test_pre_read_mode(page: Page):
    # 1. Go to the verification page
    page.goto("http://localhost:8080/verification")

    # 2. Wait for the page to load and check we are in Pre-Read mode
    # The welcome text should say "Select a Lecture for Pre-Read Summary"
    expect(page.get_by_text("Select a Lecture for Pre-Read Summary")).to_be_visible()

    # 3. Open the lecture selector
    # It might be a Select trigger with "Select a lecture..."
    page.click("button:has-text('Select a lecture...')")

    # 4. Select a lecture
    page.click("text=Lecture 1: Introduction")

    # 5. Verify the "Create Pre-Read Summary" button appears
    create_button = page.get_by_role("button", name="Create Pre-Read Summary")
    expect(create_button).to_be_visible()

    # 6. Take a screenshot
    page.screenshot(path="verification/verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_pre_read_mode(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
