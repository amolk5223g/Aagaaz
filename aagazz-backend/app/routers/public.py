from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from typing import Optional, Any
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Event, EligibleStudent, Student, FoodCoupon
from app.schemas import EventResponse
from app.security import normalize_usn
from app.services.coupon_service import get_or_create_food_coupon
from app.services.brevo_service import send_brevo_food_pass
from app.services.audit_service import log_audit

router = APIRouter(tags=["Public Events & Webhooks"])

class GoogleFormSubmission(BaseModel):
    usn: str
    student_name: Optional[str] = "Student"
    email: str
    year: Optional[Any] = 1
    department: Optional[str] = "AI & DS"

@router.get("/api/v1/events/active", response_model=EventResponse)
def get_active_event(db: Session = Depends(get_db)):
    """Returns the primary active event for AAGAZZ 2K26."""
    event = db.query(Event).order_by(Event.created_at.desc()).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active event found"
        )
    return event

@router.post("/api/v1/events/google-form-webhook")
@router.post("/api/v1/public/google-form-webhook")
def google_form_webhook(
    payload: GoogleFormSubmission,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Automated webhook triggered whenever a student submits the Google Form.
    - Normalizes USN & cleans email
    - Whitelists and registers the student
    - Generates unique Food Pass
    - Immediately dispatches VIP Food Pass email with QR code via Brevo
    - Enforces 1-coupon policy
    """
    clean_usn = normalize_usn(payload.usn)
    if not clean_usn:
        raise HTTPException(status_code=400, detail="Invalid USN provided.")

    clean_email = (payload.email or "").strip().lower()
    clean_email = clean_email.replace("@gamil.com", "@gmail.com").replace("@gamail.com", "@gmail.com")
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Invalid email address provided.")

    clean_name = (payload.student_name or "").strip() or "Student"
    clean_dept = (payload.department or "").strip() or "AI & DS"

    # Year parsing
    try:
        clean_year = int(str(payload.year).strip()) if payload.year is not None else 1
    except Exception:
        clean_year = 1

    event = db.query(Event).order_by(Event.created_at.desc()).first()
    if not event:
        raise HTTPException(status_code=500, detail="No active event configured.")

    # 1. Check if student already has a coupon
    existing_student = db.query(Student).filter(Student.usn == clean_usn).first()
    if existing_student and existing_student.coupon:
        coupon = existing_student.coupon
        if coupon.status == "REDEEMED":
            return {
                "status": "ALREADY_REDEEMED",
                "message": "This USN has ALREADY redeemed its food pass. Duplicate coupons cannot be issued.",
                "usn": clean_usn,
                "student_name": existing_student.student_name,
                "coupon_code": coupon.coupon_code
            }
        else:
            # Re-send pass to student's email in case they lost it
            sent, _ = send_brevo_food_pass(
                to_email=clean_email,
                student_name=existing_student.student_name,
                usn=clean_usn,
                coupon_code=coupon.coupon_code,
                qr_token=coupon.coupon_code
            )
            return {
                "status": "ALREADY_REGISTERED",
                "message": "You already hold an active food pass. It has been re-sent to your email.",
                "usn": clean_usn,
                "student_name": existing_student.student_name,
                "coupon_code": coupon.coupon_code,
                "email_delivered": sent
            }

    # 2. Whitelist in eligible_students
    whitelisted = db.query(EligibleStudent).filter(EligibleStudent.usn == clean_usn).first()
    if not whitelisted:
        whitelisted = EligibleStudent(
            usn=clean_usn,
            student_name=clean_name,
            email=clean_email,
            department=clean_dept,
            year=clean_year,
            is_active=True,
            is_registered=True
        )
        db.add(whitelisted)
        db.commit()
        db.refresh(whitelisted)
    else:
        whitelisted.email = clean_email
        whitelisted.student_name = clean_name
        whitelisted.is_registered = True
        db.commit()

    # 3. Create Student record
    if not existing_student:
        student = Student(
            eligible_student_id=whitelisted.id,
            event_id=event.id,
            usn=clean_usn,
            student_name=clean_name,
            email=clean_email,
            department=clean_dept,
            batch=event.batch,
            auth_user_id=whitelisted.id
        )
        db.add(student)
        db.commit()
        db.refresh(student)
    else:
        student = existing_student

    # 4. Generate unique Food Coupon
    coupon, raw_token, is_new = get_or_create_food_coupon(db, student=student, event=event)

    # 5. Dispatch VIP Food Pass email with QR code via Brevo
    sent, delivery_msg = send_brevo_food_pass(
        to_email=clean_email,
        student_name=clean_name,
        usn=clean_usn,
        coupon_code=coupon.coupon_code,
        qr_token=coupon.coupon_code
    )

    log_audit(
        db,
        action="GOOGLE_FORM_PASS_ISSUED",
        target_entity="food_coupons",
        target_id=coupon.id,
        actor_email=clean_email,
        actor_role="STUDENT",
        details={
            "usn": clean_usn,
            "email": clean_email,
            "coupon_code": coupon.coupon_code,
            "email_delivered": sent,
            "delivery_info": delivery_msg
        },
        ip_address=request.client.host if request and hasattr(request, 'client') and request.client else None
    )

    return {
        "status": "SUCCESS",
        "message": "VIP Food Pass generated and delivered to student email successfully!",
        "usn": clean_usn,
        "student_name": clean_name,
        "email": clean_email,
        "coupon_code": coupon.coupon_code,
        "email_delivered": sent
    }

