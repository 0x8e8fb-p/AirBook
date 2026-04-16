from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    print("Navigating to /profile?tab=alerts...")
    page.goto('http://localhost:3000/profile?tab=alerts')
    page.wait_for_load_state('networkidle')
    
    print("Checking if 'Sign in required' is visible...")
    if page.locator("text=Sign in required").is_visible():
        print("Success: 'Sign in required' is visible on the Alerts tab!")
    else:
        print("Error: 'Sign in required' is NOT visible.")
        
    print("Clicking the Sign In button on the Navbar...")
    page.locator("button:has-text('Sign In')").first.click()
    page.wait_for_load_state('networkidle')
    
    print(f"Current URL after clicking Sign In: {page.url}")
    
    if "404" in page.title() or "This page could not be found" in page.content():
        print("Error: Reached a 404 page!")
    else:
        print("Success: No 404 page encountered!")
        
    browser.close()