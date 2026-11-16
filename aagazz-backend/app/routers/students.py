from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models import Student, Event, FoodCoupon, Redemption, EligibleStudent
from app.schemas import FoodCouponResponse, ClaimTicketRequest, ClaimTicketResponse
from app.dependencies import get_current_student
from app.security import normalize_usn, create_access_token
from app.services.coupon_service import get_or_create_food_coupon
from app.services.audit_service import log_audit

router = APIRouter(prefix="/api/v1/students", tags=["Student Portal"])

@router.post("/claim-ticket", response_model=ClaimTicketResponse)
def claim_or_get_ticket(payload: ClaimTicketRequest, request: Request, db: Session = Depends(get_db)):
    """
    Direct Student Ticket Claim:
    Validates USN against approved AI & DS whitelist and verifies the event access code.
    Immediately creates or retrieves the student's unique digital food coupon with QR code.
    Exactly one coupon per student is strictly enforced.
    """
    usn = normalize_usn(payload.usn)
    if not usn:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid College USN."
        )

    # 1. Verify Common Event Access Code
    entered_code = payload.access_code.strip().upper()
    expected_code = settings.EVENT_ACCESS_CODE.strip().upper()
    if entered_code != expected_code:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Event Access Code. Please enter the official department passcode."
        )

    # 2. Check Whitelist
    whitelisted = db.query(EligibleStudent).filter(EligibleStudent.usn == usn).first()
    if not whitelisted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"USN '{usn}' not found on official AI & DS whitelist. Registration is strictly restricted to AI & DS students."
        )

    if not whitelisted.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your student record is currently marked inactive. Please contact the coordinator."
        )

    # 3. Check Event State
    event = db.query(Event).order_by(Event.created_at.desc()).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Event information not found."
        )

    if not event.is_registration_open:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Event ticket registration is currently closed."
        )

    # 4. Get or Register Student
    student = db.query(Student).filter(Student.usn == usn).first()
    if not student:
        student = Student(
            eligible_student_id=whitelisted.id,
            event_id=event.id,
            usn=whitelisted.usn,
            student_name=whitelisted.student_name,
            email=whitelisted.email,
            department=whitelisted.department,
            batch=event.batch,
            auth_user_id=whitelisted.id
        )
        db.add(student)
        whitelisted.is_registered = True
        db.commit()
        db.refresh(student)

    # 5. Issue or retrieve food coupon
    coupon, raw_token, is_new = get_or_create_food_coupon(db, student=student, event=event)

    # 6. Audit Log
    if is_new:
        log_audit(
            db,
            action="CLAIM_TICKET_NEW",
            target_entity="food_coupons",
            target_id=coupon.id,
            actor_email=student.email or student.usn,
            actor_role="STUDENT",
            details={"usn": student.usn, "coupon_code": coupon.coupon_code},
            ip_address=request.client.host if request.client else None
        )

    # 7. Issue JWT token for persistent student session
    access_token = create_access_token(
        data={
            "sub": student.usn,
            "role": "STUDENT",
            "usn": student.usn,
            "student_id": student.id
        },
        expires_delta=timedelta(days=30) # Long-lived session
    )

    qr_payload = raw_token if raw_token else coupon.coupon_code
    redemption = coupon.redemption

    return ClaimTicketResponse(
        success=True,
        message="VIP Food Pass claimed successfully!" if is_new else "VIP Food Pass retrieved successfully.",
        access_token=access_token,
        token_type="bearer",
        coupon_id=coupon.id,
        coupon_code=coupon.coupon_code,
        qr_token=qr_payload,
        status=coupon.status,
        student_name=student.student_name,
        usn=student.usn,
        department=student.department,
        batch=student.batch,
        created_at=coupon.created_at,
        redeemed_at=redemption.redeemed_at if redemption else None,
        volunteer_name=redemption.volunteer_name if redemption else None
    )

@router.get("/me")
def get_student_profile(student: Student = Depends(get_current_student)):
    return {
        "id": student.id,
        "usn": student.usn,
        "student_name": student.student_name,
        "email": student.email,
        "department": student.department,
        "batch": student.batch,
        "registered_at": student.registered_at
    }

@router.post("/register", response_model=FoodCouponResponse)
def register_and_generate_coupon(
    request: Request,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Issues one-time food coupon to the authenticated student.
    If the coupon already exists, returns the existing coupon.
    Never creates a duplicate.
    """
    event = db.query(Event).filter(Event.id == student.event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Event not found."
        )

    coupon, raw_token, is_new = get_or_create_food_coupon(db, student=student, event=event)

    if is_new:
        log_audit(
            db,
            action="COUPON_GENERATED",
            target_entity="food_coupons",
            target_id=coupon.id,
            actor_email=student.email,
            actor_role="STUDENT",
            details={"usn": student.usn, "coupon_code": coupon.coupon_code},
            ip_address=request.client.host if request.client else None
        )

    # For QR generation on student view:
    # If newly created, we have raw_token. If retrieved later, we provide the coupon_code as the QR payload
    # or the raw_token if newly generated. Either way, volunteer scanner verifies both!
    qr_payload = raw_token if raw_token else coupon.coupon_code

    redemption = coupon.redemption
    return FoodCouponResponse(
        coupon_id=coupon.id,
        coupon_code=coupon.coupon_code,
        qr_token=qr_payload,
        status=coupon.status,
        student_name=student.student_name,
        usn=student.usn,
        department=student.department,
        batch=student.batch,
        created_at=coupon.created_at,
        redeemed_at=redemption.redeemed_at if redemption else None,
        volunteer_name=redemption.volunteer_name if redemption else None
    )

@router.get("/me/coupon", response_model=FoodCouponResponse)
def get_my_coupon(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Retrieves the authenticated student's existing food coupon."""
    coupon = db.query(FoodCoupon).filter(FoodCoupon.student_id == student.id).first()
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food coupon has not been generated yet. Please click Claim Food Coupon."
        )

    redemption = coupon.redemption
    return FoodCouponResponse(
        coupon_id=coupon.id,
        coupon_code=coupon.coupon_code,
        qr_token=coupon.coupon_code, # Use the verifiable unique code for returning view
        status=coupon.status,
        student_name=student.student_name,
        usn=student.usn,
        department=student.department,
        batch=student.batch,
        created_at=coupon.created_at,
        redeemed_at=redemption.redeemed_at if redemption else None,
        volunteer_name=redemption.volunteer_name if redemption else None
    )

@router.get("/me/status")
def get_coupon_status(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Quick live status check for the coupon."""
    coupon = db.query(FoodCoupon).filter(FoodCoupon.student_id == student.id).first()
    if not coupon:
        return {"has_coupon": False, "status": "NOT_GENERATED"}

    redemption = coupon.redemption
    return {
        "has_coupon": True,
        "coupon_id": coupon.id,
        "coupon_code": coupon.coupon_code,
        "status": coupon.status,
        "redeemed_at": redemption.redeemed_at if redemption else None,
        "volunteer_name": redemption.volunteer_name if redemption else None
    }

