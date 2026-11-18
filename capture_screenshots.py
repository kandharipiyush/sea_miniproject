import time
from playwright.sync_api import sync_playwright

def capture_all():
    screenshots_dir = "c:/Users/Lenovo/OneDrive/Desktop/SEA_miniproject/screenshots"
    base_url = "http://localhost:5173"

    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        context = browser.new_context(viewport={"width": 1366, "height": 820})
        page = context.new_page()

        # 1. Fig 1: Authentication & Login Modal
        print("Capturing Fig 1: Authentication...")
        page.goto(f"{base_url}/")
        page.wait_for_load_state("networkidle")
        time.sleep(1.5)
        # Click login button in navbar if available
        try:
            btn = page.query_selector("button:has-text('Sign In'), button:has-text('Login')")
            if btn:
                btn.click()
                time.sleep(1)
        except Exception as e:
            print("Modal click notice:", e)
        page.screenshot(path=f"{screenshots_dir}/fig1_auth.png")

        # 2. Fig 2: Patient Dashboard & City Selector
        print("Capturing Fig 2: Patient Dashboard...")
        page.goto(f"{base_url}/dashboard")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        page.screenshot(path=f"{screenshots_dir}/fig2_patient_dashboard.png")

        # 3. Fig 3: Doctor Specialization Directory
        print("Capturing Fig 3: Doctor Directory...")
        page.goto(f"{base_url}/doctors")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        page.screenshot(path=f"{screenshots_dir}/fig3_doctor_directory.png")

        # 4. Fig 4: Interactive GIS Healthcare Map
        print("Capturing Fig 4: Interactive Map...")
        page.goto(f"{base_url}/map")
        page.wait_for_load_state("networkidle")
        time.sleep(3) # allow leaflet map tiles to render
        page.screenshot(path=f"{screenshots_dir}/fig4_gis_map.png")

        # 5. Fig 5: Hospital Discovery & Comparison Matrix
        print("Capturing Fig 5: Hospital Discovery...")
        page.goto(f"{base_url}/hospitals")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        page.screenshot(path=f"{screenshots_dir}/fig5_hospital_comparison.png")

        # 6. Fig 6: 24x7 Emergency Trauma & Ambulance
        print("Capturing Fig 6: Emergency Assistance...")
        page.goto(f"{base_url}/emergency")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        page.screenshot(path=f"{screenshots_dir}/fig6_emergency.png")

        # 7. Fig 7: Doctor Consultation & Clinical Queue Portal
        print("Capturing Fig 7: Doctor Consultation...")
        page.goto(f"{base_url}/doctor")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        page.screenshot(path=f"{screenshots_dir}/fig7_doctor_portal.png")

        # 8. Fig 8: Hospital Branch Management Dashboard
        print("Capturing Fig 8: Hospital Admin...")
        page.goto(f"{base_url}/hospital-admin")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        page.screenshot(path=f"{screenshots_dir}/fig8_hospital_admin.png")

        # 9. Fig 9: Diagnostic Test Booking & Pathology
        print("Capturing Fig 9: Diagnostics...")
        page.goto(f"{base_url}/diagnostics")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        page.screenshot(path=f"{screenshots_dir}/fig9_diagnostics.png")

        # 10. Fig 10: Super-Admin Operational Analytics
        print("Capturing Fig 10: Super Admin...")
        page.goto(f"{base_url}/admin")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        page.screenshot(path=f"{screenshots_dir}/fig10_super_admin.png")

        # 11. Fig 11: 24/7 Verified Pharmacies & Prescription Distribution
        print("Capturing Fig 11: Pharmacies & Prescription Fulfillment...")
        page.goto(f"{base_url}/pharmacies")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        page.screenshot(path=f"{screenshots_dir}/fig11_pharmacies.png")

        browser.close()
        print("All screenshots successfully captured!")

if __name__ == "__main__":
    capture_all()
