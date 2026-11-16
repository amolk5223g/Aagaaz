import pytest
from fastapi.testclient import TestClient
from app.main import app, seed_initial_data
from app.database import Base, engine, SessionLocal
from app.models import EligibleStudent, FoodCoupon, Student, Event, UserRole, Redemption

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def init_db_once():
    seed_initial_data()

@pytest.fixture(autouse=True)
def setup_test_db():
    db = SessionLocal()
    # Reset registrations & redemptions for consistent tests
    db.query(Redemption).delete()
    db.query(FoodCoupon).delete()
    db.query(Student).delete()
    db.commit()
    db.close()
    yield

def test_root_and_health():
    response = client.get("/")
    assert response.status_code == 200
    assert "AAGAZZ 2K26" in response.json()["app"]

    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"

def test_active_event():
    response = client.get("/api/v1/events/active")
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "AAGAZZ 2K26"
    assert data["department"] == "AI & DS"

def test_eligibility_valid_usn():
    response = client.post("/api/v1/auth/eligibility", json={"usn": "4SG25AD001"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ELIGIBLE"
    assert data["student_name"] == "Adarsh Kulkarni"
    assert "***" in data["masked_email"]

def test_eligibility_invalid_usn():
    response = client.post("/api/v1/auth/eligibility", json={"usn": "INVALID_USN_999"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "INVALID_USN"
    assert "STUDENT NOT FOUND" in data["message"]

def test_otp_flow_and_coupon_generation():
    # 1. Send OTP
    send_resp = client.post("/api/v1/auth/send-otp", json={"usn": "4SG25AD002"})
    assert send_resp.status_code == 200
    send_data = send_resp.json()
    assert send_data["success"] is True
    otp = send_data["dev_otp"]
    assert otp is not None
    assert len(otp) == 6

    # 2. Test Invalid OTP
    bad_otp = client.post("/api/v1/auth/verify-identity", json={"usn": "4SG25AD002", "otp": "000000"})
    assert bad_otp.status_code == 400

    # 3. Test Valid OTP
    verify_resp = client.post("/api/v1/auth/verify-identity", json={"usn": "4SG25AD002", "otp": otp})
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()
    token = verify_data["access_token"]
    assert token is not None

    # 4. Generate Coupon (First time)
    headers = {"Authorization": f"Bearer {token}"}
    coupon_resp = client.post("/api/v1/students/register", headers=headers)
    assert coupon_resp.status_code == 200
    coupon_data = coupon_resp.json()
    assert coupon_data["status"] == "ACTIVE"
    assert coupon_data["coupon_code"].startswith("FC-AAGAZZ-2026-")
    first_coupon_id = coupon_data["coupon_id"]

    # 5. Subsequent request / Refresh MUST return the same coupon!
    second_resp = client.post("/api/v1/students/register", headers=headers)
    assert second_resp.status_code == 200
    assert second_resp.json()["coupon_id"] == first_coupon_id

    # 6. Retrieve coupon via GET
    get_coupon = client.get("/api/v1/students/me/coupon", headers=headers)
    assert get_coupon.status_code == 200
    assert get_coupon.json()["coupon_id"] == first_coupon_id

def test_volunteer_scanner_and_duplicate_prevention():
    # Login as volunteer
    vol_login = client.post("/api/v1/auth/login", json={
        "email": "volunteer@sgbit.edu.in",
        "password": "Volunteer@2026"
    })
    assert vol_login.status_code == 200
    vol_token = vol_login.json()["access_token"]
    vol_headers = {"Authorization": f"Bearer {vol_token}"}

    # Setup student with coupon
    otp_resp = client.post("/api/v1/auth/send-otp", json={"usn": "4SG25AD003"}).json()
    student_token = client.post("/api/v1/auth/verify-identity", json={
        "usn": "4SG25AD003", "otp": otp_resp["dev_otp"]
    }).json()["access_token"]
    
    student_headers = {"Authorization": f"Bearer {student_token}"}
    coupon_data = client.post("/api/v1/students/register", headers=student_headers).json()
    coupon_code = coupon_data["coupon_code"]
    qr_token = coupon_data["qr_token"]

    # 1. Validate before redemption
    val_resp = client.post("/api/v1/volunteer/coupons/validate", json={"qr_token": qr_token}, headers=vol_headers)
    assert val_resp.status_code == 200
    assert val_resp.json()["valid"] is True
    assert val_resp.json()["status"] == "ACTIVE"

    # 2. First Redemption -> MUST SUCCEED
    redeem_resp = client.post("/api/v1/volunteer/coupons/redeem", json={"qr_token": qr_token}, headers=vol_headers)
    assert redeem_resp.status_code == 200
    assert redeem_resp.json()["status"] == "SUCCESS"
    assert redeem_resp.json()["success"] is True

    # 3. Second Redemption of SAME coupon -> MUST SHOW ALREADY REDEEMED!
    second_scan = client.post("/api/v1/volunteer/coupons/redeem", json={"qr_token": qr_token}, headers=vol_headers)
    assert second_scan.status_code == 200
    assert second_scan.json()["status"] == "ALREADY_REDEEMED"
    assert second_scan.json()["success"] is False
    assert "ALREADY REDEEMED" in second_scan.json()["message"]

def test_admin_rbac_and_privileges():
    # Volunteer trying to access admin endpoint -> 403 Forbidden
    vol_login = client.post("/api/v1/auth/login", json={
        "email": "volunteer@sgbit.edu.in",
        "password": "Volunteer@2026"
    }).json()
    vol_headers = {"Authorization": f"Bearer {vol_login['access_token']}"}

    forbidden_resp = client.get("/api/v1/admin/analytics", headers=vol_headers)
    assert forbidden_resp.status_code == 403

    # Admin login -> 200 OK
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@sgbit.edu.in",
        "password": "Aagazz@2026"
    }).json()
    admin_headers = {"Authorization": f"Bearer {admin_login['access_token']}"}

    analytics = client.get("/api/v1/admin/analytics", headers=admin_headers)
    assert analytics.status_code == 200
    data = analytics.json()
    assert data["total_eligible_students"] > 0
