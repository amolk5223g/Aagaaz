import secrets
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from app.models import Student, FoodCoupon, Redemption, Event, EligibleStudent, UserRole
from app.security import generate_secure_token, hash_qr_token

def generate_unique_coupon_code(student_usn: str) -> str:
    """e.g. FC-AAGAZZ-2026-089 or FC-AAGAZZ-2026-X9A2"""
    suffix = student_usn[-3:] if len(student_usn) >= 3 else secrets.token_hex(2).upper()
    return f"FC-AAGAZZ-2026-{suffix}"

def get_or_create_food_coupon(db: Session, student: Student, event: Event) -> tuple[FoodCoupon, str, bool]:
    """
    Guarantees exactly ONE coupon per student.
    If coupon exists, retrieves existing coupon.
    If new, generates cryptographically secure QR token and stores SHA-256 hash.
    Returns: (coupon_record, raw_qr_token, is_newly_created)
    """
    # 1. Check if coupon already exists
    existing = db.query(FoodCoupon).filter(
        FoodCoupon.student_id == student.id,
        FoodCoupon.event_id == event.id
    ).first()
    
    if existing:
        return existing, "", False

    # 2. Check if registration is open before issuing NEW coupon
    if not event.is_registration_open:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration is currently closed. New coupons cannot be generated."
        )

    # 3. Create new coupon atomically
    raw_token = generate_secure_token()
    token_hash = hash_qr_token(raw_token)
    coupon_code = generate_unique_coupon_code(student.usn)
    
    # Handle rare coupon code collision
    existing_code = db.query(FoodCoupon).filter(FoodCoupon.coupon_code == coupon_code).first()
    if existing_code:
        coupon_code = f"FC-AAGAZZ-2026-{secrets.token_hex(3).upper()}"

    new_coupon = FoodCoupon(
        student_id=student.id,
        event_id=event.id,
        coupon_code=coupon_code,
        qr_token_hash=token_hash,
        status="ACTIVE"
    )

    try:
        db.add(new_coupon)
        db.commit()
        db.refresh(new_coupon)
        return new_coupon, raw_token, True
    except IntegrityError:
        db.rollback()
        # Concurrent request happened: fetch the newly committed coupon
        existing = db.query(FoodCoupon).filter(
            FoodCoupon.student_id == student.id,
            FoodCoupon.event_id == event.id
        ).first()
        if existing:
            return existing, "", False
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error issuing unique food coupon."
        )

def lookup_coupon(db: Session, qr_token: str = None, coupon_code: str = None) -> FoodCoupon:
    """Finds coupon by QR raw token or manual coupon code"""
    query = db.query(FoodCoupon)
    if qr_token:
        token_hash = hash_qr_token(qr_token.strip())
        coupon = query.filter(FoodCoupon.qr_token_hash == token_hash).first()
        if coupon:
            return coupon
            
    if coupon_code:
        clean_code = coupon_code.strip().upper()
        coupon = query.filter(FoodCoupon.coupon_code == clean_code).first()
        if coupon:
            return coupon
            
    return None

def redeem_coupon_atomically(
    db: Session,
    volunteer: UserRole,
    qr_token: str = None,
    coupon_code: str = None,
    counter_name: str = "Main Food Counter"
) -> dict:
    """
    Performs atomic redemption of coupon.
    Guarantees:
    - Coupon exists
    - Student is active
    - Coupon is ACTIVE (not REDEEMED and not REVOKED)
    - Concurrency-safe: Exactly one redemption succeeds even on simultaneous scans!
    """
    # Start transaction with row lock when possible
    coupon = lookup_coupon(db, qr_token=qr_token, coupon_code=coupon_code)
    if not coupon:
        return {
            "success": False,
            "status": "NOT_FOUND",
            "message": "Invalid QR code or coupon code not recognized."
        }
    
    # Check if student is active
    if not coupon.student.eligible_student.is_active:
        return {
            "success": False,
            "status": "REVOKED",
            "message": "Student registration has been deactivated. Coupon cannot be redeemed.",
            "coupon_id": coupon.id,
            "coupon_code": coupon.coupon_code,
            "student_name": coupon.student.student_name,
            "usn": coupon.student.usn
        }

    # Check if already revoked
    if coupon.status == "REVOKED":
        return {
            "success": False,
            "status": "REVOKED",
            "message": f"This coupon has been revoked! Reason: {coupon.revocation_reason or 'Administrative override'}",
            "coupon_id": coupon.id,
            "coupon_code": coupon.coupon_code,
            "student_name": coupon.student.student_name,
            "usn": coupon.student.usn
        }

    # Check if already redeemed
    if coupon.status == "REDEEMED":
        redemption = coupon.redemption
        redeemed_time = redemption.redeemed_at.strftime("%I:%M %p, %d %b %Y") if redemption else "Earlier"
        volunteer_name = redemption.volunteer_name if redemption else "Staff"
        return {
            "success": False,
            "status": "ALREADY_REDEEMED",
            "message": f"ALREADY REDEEMED! Claimed at {redeemed_time} by {volunteer_name}.",
            "coupon_id": coupon.id,
            "coupon_code": coupon.coupon_code,
            "student_name": coupon.student.student_name,
            "usn": coupon.student.usn,
            "volunteer_name": volunteer_name,
            "redeemed_at": redemption.redeemed_at if redemption else None
        }

    # Attempt atomic status transition from ACTIVE to REDEEMED
    # Conditional UPDATE to prevent race condition
    updated_rows = db.query(FoodCoupon).filter(
        FoodCoupon.id == coupon.id,
        FoodCoupon.status == "ACTIVE"
    ).update(
        {
            "status": "REDEEMED",
            "updated_at": datetime.utcnow()
        },
        synchronize_session=False
    )

    if updated_rows == 0:
        # Another concurrent scan won the race!
        db.rollback()
        coupon_refresh = db.query(FoodCoupon).filter(FoodCoupon.id == coupon.id).first()
        redemption = coupon_refresh.redemption
        return {
            "success": False,
            "status": "ALREADY_REDEEMED",
            "message": "ALREADY REDEEMED! Just scanned at another counter.",
            "coupon_id": coupon.id,
            "coupon_code": coupon.coupon_code,
            "student_name": coupon.student.student_name,
            "usn": coupon.student.usn,
            "volunteer_name": redemption.volunteer_name if redemption else "Another Volunteer",
            "redeemed_at": redemption.redeemed_at if redemption else None
        }

    # Create redemption record
    redemption_record = Redemption(
        coupon_id=coupon.id,
        volunteer_id=volunteer.id,
        volunteer_name=volunteer.full_name,
        counter_name=counter_name,
        redeemed_at=datetime.utcnow()
    )
    db.add(redemption_record)
    db.commit()

    return {
        "success": True,
        "status": "SUCCESS",
        "message": "FOOD COUPON SUCCESSFULLY REDEEMED",
        "coupon_id": coupon.id,
        "coupon_code": coupon.coupon_code,
        "student_name": coupon.student.student_name,
        "usn": coupon.student.usn,
        "volunteer_name": volunteer.full_name,
        "redeemed_at": redemption_record.redeemed_at
    }

