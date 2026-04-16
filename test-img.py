from playwright.sync_api import sync_playwright
import time

def check_images():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # We'll just load the homepage, which will test if next/image or general image loading is breaking
        page.goto('http://localhost:3000/search?origin=DEL&destination=BOM&date=2026-05-01&adults=1&cabin=economy')
        page.wait_for_load_state('networkidle')
        time.sleep(3) # Let search finish
        
        # Check if any kiwi images are present
        imgs = page.locator('img[src*="kiwi.com"]').all()
        print(f"Found {len(imgs)} kiwi images")
        
        if len(imgs) > 0:
            for i, img in enumerate(imgs[:3]):
                print(f"Image {i}: visible={img.is_visible()}, src={img.get_attribute('src')}")
                
        browser.close()

if __name__ == "__main__":
    check_images()