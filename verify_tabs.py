from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:5173", timeout=5000)

            # Verify "Планы действий" tab
            plans_button = page.get_by_role("button", name="Планы действий")
            expect(plans_button).to_be_visible()
            plans_button.click()

            # Check for content in the plans tab
            expect(page.get_by_text("Планы действий по категориям")).to_be_visible()
            page.screenshot(path="plans_tab.png")

            # Verify "Аналитика" tab
            analytics_button = page.get_by_role("button", name="Аналитика")
            expect(analytics_button).to_be_visible()
            analytics_button.click()

            # Check for content in the analytics tab
            expect(page.get_by_text("Аналитика обращений")).to_be_visible()
            expect(page.get_by_text("Расширенная аналитика по категориям")).to_be_visible()
            page.screenshot(path="analytics_tab.png")

        except Exception as e:
            print(f"An error occurred: {e}")
            page.screenshot(path="error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
