from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app.models import EligibleStudent, Student, Event, UserRole, FoodCoupon
from app.schemas import (
    EligibilityCheckRequest, EligibilityCheckResponse,
    SendOtpRequest, SendOtpResponse,
    VerifyIdentityRequest, VerifyIdentityResponse,
    LoginRequest, Token
)
from app.security import (
    normalize_usn, mask_email, verify_password,
    create_access_token
)
from app.services.otp_service import create_and_send_otp, verify_otp_code
from app.services.audit_service import log_audit
from app.config import settings

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication & Eligibility"])

@router.post("/eligibility", response_model=EligibilityCheckResponse)
def check_eligibility(payload: EligibilityCheckRequest, db: Session = Depends(get_db)):
    """
    Checks student eligibility:
    1. Normalizes USN
    2. Searches eligible_students whitelist
    3. Verifies active state
    4. Verifies AI & DS department
    5. Checks if registration is open
    6. Checks if already registered / already has coupon
    """
    usn = normalize_usn(payload.usn)
    if not usn:
        return EligibilityCheckResponse(
            status="INVALID_USN",
            message="Please provide a valid University Seat Number."
        )

    # Fetch active event
    event = db.query(Event).order_by(Event.created_at.desc()).first()
    
    # Query whitelist
    whitelisted = db.query(EligibleStudent).filter(EligibleStudent.usn == usn).first()
    if not whitelisted:
        return EligibilityCheckResponse(
            status="INVALID_USN",
            message="STUDENT NOT FOUND. Registration is strictly restricted to approved AI & DS department students.",
            usn=usn
        )

    # Department validation
    dept = whitelisted.department.upper()
    if "AI" not in dept and "DS" not in dept:
        return EligibilityCheckResponse(
            status="INVALID_USN",
            message=f"Department '{whitelisted.department}' is not eligible. AAGAZZ 2K26 is reserved for AI & DS students.",
            usn=usn
        )

    # Check active state
    if not whitelisted.is_active:
        return EligibilityCheckResponse(
            status="INACTIVE",
            message="Your student profile is currently deactivated. Please contact the department coordinator.",
            usn=usn,
            student_name=whitelisted.student_name
        )

    # Check existing registration & coupon
    registered_student = db.query(Student).filter(Student.usn == usn).first()
    if registered_student:
        coupon = db.query(FoodCoupon).filter(FoodCoupon.student_id == registered_student.id).first()
        return EligibilityCheckResponse(
            status="ALREADY_REGISTERED",
            message="YOU ALREADY HAVE YOUR AAGAZZ FOOD COUPON! Proceed to verify passcode to retrieve your coupon.",
            student_name=whitelisted.student_name,
            masked_email=mask_email(whitelisted.email),
            usn=usn,
            department=whitelisted.department,
            has_existing_coupon=coupon is not None,
            coupon_id=coupon.id if coupon else None
        )

    # Check registration open
    if event and not event.is_registration_open:
        return EligibilityCheckResponse(
            status="REGISTRATION_CLOSED",
            message="REGISTRATION IS CURRENTLY CLOSED.",
            usn=usn,
            student_name=whitelisted.student_name
        )

    # Eligible!
    return EligibilityCheckResponse(
        status="ELIGIBLE",
        message="YOU ARE ELIGIBLE!",
        student_name=whitelisted.student_name,
        masked_email=mask_email(whitelisted.email),
        usn=usn,
        department=whitelisted.department,
        has_existing_coupon=False
    )

@router.post("/send-otp", response_model=SendOtpResponse)
def send_otp(payload: SendOtpRequest, request: Request, db: Session = Depends(get_db)):
    """Dispatches a one-time passcode to the student's registered college email."""
    usn = normalize_usn(payload.usn)
    whitelisted = db.query(EligibleStudent).filter(EligibleStudent.usn == usn).first()
    if not whitelisted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found on official AI & DS whitelist."
        )

    if not whitelisted.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student profile is deactivated."
        )

    success, masked_email, otp_code = create_and_send_otp(
        db, usn=whitelisted.usn, email=whitelisted.email, student_name=whitelisted.student_name
    )

    log_audit(
        db,
        action="SEND_OTP",
        target_entity="eligible_students",
        target_id=whitelisted.id,
        actor_email=whitelisted.email,
        actor_role="STUDENT",
        details={"usn": usn},
        ip_address=request.client.host if request.client else None
    )

    return SendOtpResponse(
        success=True,
        message=f"Passcode dispatched to your registered college email ({masked_email}).",
        masked_email=masked_email,
        expires_in_seconds=300,
        dev_otp=otp_code if settings.DEV_OTP_MODE else None
    )

@router.post("/verify-identity", response_model=VerifyIdentityResponse)
def verify_identity(payload: VerifyIdentityRequest, request: Request, db: Session = Depends(get_db)):
    """Verifies OTP and returns student JWT token."""
    usn = normalize_usn(payload.usn)
    whitelisted = db.query(EligibleStudent).filter(EligibleStudent.usn == usn).first()
    if not whitelisted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found on official whitelist."
        )

    # Validate OTP code
    is_valid, msg = verify_otp_code(db, usn=usn, entered_otp=payload.otp)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg
        )

    # Get active event
    event = db.query(Event).order_by(Event.created_at.desc()).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No active event configured."
        )

    # Ensure Student record exists or get existing
    student = db.query(Student).filter(Student.usn == usn).first()
    if not student:
        # Check registration open before first time registration
        if not event.is_registration_open:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration is currently closed."
            )
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

    # Check if coupon exists
    coupon = db.query(FoodCoupon).filter(FoodCoupon.student_id == student.id).first()

    # Generate JWT for student
    access_token = create_access_token(
        data={
            "sub": student.email,
            "role": "STUDENT",
            "usn": student.usn,
            "student_id": student.id
        },
        expires_delta=timedelta(hours=24)
    )

    log_audit(
        db,
        action="VERIFY_IDENTITY_SUCCESS",
        target_entity="students",
        target_id=student.id,
        actor_email=student.email,
        actor_role="STUDENT",
        details={"usn": usn},
        ip_address=request.client.host if request.client else None
    )

    return VerifyIdentityResponse(
        success=True,
        message="Identity verified successfully.",
        access_token=access_token,
        token_type="bearer",
        student_id=student.id,
        usn=student.usn,
        student_name=student.student_name,
        email=student.email,
        department=student.department,
        has_coupon=coupon is not None
    )

@router.post("/login", response_model=Token)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Admin and Volunteer login endpoint."""
    user = db.query(UserRole).filter(UserRole.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact an administrator."
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id},
        expires_delta=timedelta(hours=24)
    )

    log_audit(
        db,
        action="LOGIN_SUCCESS",
        target_entity="user_roles",
        target_id=user.id,
        actor_id=user.id,
        actor_email=user.email,
        actor_role=user.role,
        ip_address=request.client.host if request.client else None
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        full_name=user.full_name,
        email=user.email
    )

