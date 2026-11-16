import io
import csv
import sys
from fastapi.testclient import TestClient

# Ensure backend app is imported
sys.path.insert(0, "aagazz-backend")
from app.main import app, seed_initial_data
from app.database import SessionLocal
from app.models import Student, FoodCoupon, Redemption, EligibleStudent

client = TestClient(app)

def run_verification():
    print("==================================================================")
    print("       AAGAZZ 2K26 - COMPREHENSIVE END-TO-END VERIFICATION       ")
    print("==================================================================")

    # 0. Initialize & Reset for clean verification run
    seed_initial_data()
    db = SessionLocal()
    db.query(Redemption).delete()
    db.query(FoodCoupon).delete()
    db.query(Student).delete()
    db.commit()
    db.close()
    print("✔ Step 0: Test environment initialized and reset")

    # 1. Health check
    res = client.get("/")
    assert res.status_code == 200
    assert "AAGAZZ 2K26" in res.json()["app"]
    print(f"✔ Step 1: Health check OK -> {res.json()['app']}")

    # 2. Check active event
    event_res = client.get("/api/v1/events/active")
    assert event_res.status_code == 200
    event_data = event_res.json()
    assert event_data["title"] == "AAGAZZ 2K26"
    assert event_data["department"] == "AI & DS"
    assert event_data["venue"] == "C102, Department of AI & DS"
    print(f"✔ Step 2: Event loaded -> {event_data['title']} on {event_data['event_date']} at {event_data['venue']}")

    # 3. Whitelist check: Valid USN
    elig_valid = client.post("/api/v1/auth/eligibility", json={"usn": "4SG25AD001"})
    assert elig_valid.status_code == 200
    assert elig_valid.json()["status"] == "ELIGIBLE"
    assert elig_valid.json()["student_name"] == "Adarsh Kulkarni"
    print(f"✔ Step 3: Valid USN 4SG25AD001 whitelisted as {elig_valid.json()['student_name']}")

    # 4. Whitelist check: Non-approved USN
    elig_invalid = client.post("/api/v1/auth/eligibility", json={"usn": "4SG23EC099"})
    assert elig_invalid.status_code == 200
    assert elig_invalid.json()["status"] == "INVALID_USN"
    print(f"✔ Step 4: Invalid USN rejected -> {elig_invalid.json()['message']}")

    # 5. OTP flow
    otp_resp = client.post("/api/v1/auth/send-otp", json={"usn": "4SG25AD001"})
    assert otp_resp.status_code == 200
    dev_otp = otp_resp.json()["dev_otp"]
    assert dev_otp is not None and len(dev_otp) == 6
    print(f"✔ Step 5: One-Time Passcode dispatched to {otp_resp.json()['masked_email']} [Code: {dev_otp}]")

    # 6. Verify Identity
    verify_resp = client.post("/api/v1/auth/verify-identity", json={"usn": "4SG25AD001", "otp": dev_otp})
    assert verify_resp.status_code == 200
    student_token = verify_resp.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}
    print(f"✔ Step 6: Identity verified with secure JWT issued for {verify_resp.json()['student_name']}")

    # 7. One-Time Food Coupon Generation
    coupon_resp = client.post("/api/v1/students/register", headers=student_headers)
    assert coupon_resp.status_code == 200
    coupon_data = coupon_resp.json()
    assert coupon_data["status"] == "ACTIVE"
    first_coupon_id = coupon_data["coupon_id"]
    coupon_code = coupon_data["coupon_code"]
    qr_token = coupon_data["qr_token"]
    print(f"✔ Step 7: Food Coupon generated -> Code: {coupon_code} | QR Token: {qr_token[:16]}... | Status: {coupon_data['status']}")

    # 8. Duplicate prevention test
    dup_resp = client.post("/api/v1/students/register", headers=student_headers)
    assert dup_resp.status_code == 200
    assert dup_resp.json()["coupon_id"] == first_coupon_id
    print("✔ Step 8: Duplicate generation prevented -> Returned existing coupon ID")

    # 9. Retrieve student's coupon
    get_coupon = client.get("/api/v1/students/me/coupon", headers=student_headers)
    assert get_coupon.status_code == 200
    assert get_coupon.json()["coupon_code"] == coupon_code
    print(f"✔ Step 9: GET /students/me/coupon confirmed persistent retrieval of {coupon_code}")

    # 10. Volunteer Login
    vol_login = client.post("/api/v1/auth/login", json={
        "email": "volunteer@sgbit.edu.in",
        "password": "Volunteer@2026"
    })
    assert vol_login.status_code == 200
    vol_token = vol_login.json()["access_token"]
    vol_headers = {"Authorization": f"Bearer {vol_token}"}
    print("✔ Step 10: Volunteer authenticated -> Shubham Kadam (Volunteer)")

    # 11. Volunteer Validates Coupon (Scan without redeem)
    val_resp = client.post("/api/v1/volunteer/coupons/validate", json={"qr_token": qr_token}, headers=vol_headers)
    assert val_resp.status_code == 200
    assert val_resp.json()["valid"] is True
    print(f"✔ Step 11: Volunteer lookup verified active pass for {val_resp.json()['student_name']}")

    # 12. Volunteer Redeems Coupon (First time -> SUCCESS)
    redeem_resp = client.post("/api/v1/volunteer/coupons/redeem", json={"qr_token": qr_token}, headers=vol_headers)
    assert redeem_resp.status_code == 200
    assert redeem_resp.json()["success"] is True
    assert redeem_resp.json()["status"] == "SUCCESS"
    print(f"✔ Step 12: First redemption SUCCESS -> Meal issued at {redeem_resp.json()['redeemed_at']}")

    # 13. Second Redemption of SAME Coupon -> MUST RETURN ALREADY_REDEEMED!
    second_redeem = client.post("/api/v1/volunteer/coupons/redeem", json={"qr_token": qr_token}, headers=vol_headers)
    assert second_redeem.status_code == 200
    assert second_redeem.json()["success"] is False
    assert second_redeem.json()["status"] == "ALREADY_REDEEMED"
    assert "ALREADY REDEEMED" in second_redeem.json()["message"]
    print(f"✔ Step 13: Second redemption BLOCKED -> {second_redeem.json()['message']}")

    # 14. Student status check reflects REDEEMED
    status_resp = client.get("/api/v1/students/me/status", headers=student_headers)
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] == "REDEEMED"
    print(f"✔ Step 14: Student live status poll confirmed -> {status_resp.json()['status']}")

    # 15. Admin Login & Analytics
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@sgbit.edu.in",
        "password": "Aagazz@2026"
    })
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("✔ Step 15: Admin authenticated -> Prof. Neha Jadhav (Admin)")

    analytics = client.get("/api/v1/admin/analytics", headers=admin_headers).json()
    assert analytics["redeemed_coupons"] == 1
    print(f"✔ Step 16: Admin analytics loaded -> {analytics['total_eligible_students']} whitelisted, {analytics['redeemed_coupons']} redeemed")

    # 16. Admin CSV Import (450 Students)
    with open("database/sample_students_450.csv", "rb") as f:
        file_bytes = f.read()
    import_resp = client.post(
        "/api/v1/admin/students/import",
        files={"file": ("sample_students_450.csv", file_bytes, "text/csv")},
        headers=admin_headers
    )
    assert import_resp.status_code == 200
    import_data = import_resp.json()
    print(f"✔ Step 17: Admin CSV bulk import completed -> {import_data['imported_records']} new students imported ({import_data['duplicate_records']} duplicates skipped)")

    print("\n==================================================================")
    print("       ALL CORE END-TO-END VERIFICATION STEPS PASSED 100%!       ")
    print("==================================================================")

if __name__ == "__main__":
    run_verification()

