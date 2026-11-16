from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import UserRole, FoodCoupon, Redemption
from app.schemas import (
    ValidateCouponRequest, ValidateCouponResponse,
    RedeemCouponRequest, RedeemCouponResponse
)
from app.dependencies import require_volunteer
from app.services.coupon_service import lookup_coupon, redeem_coupon_atomically
from app.services.audit_service import log_audit

router = APIRouter(prefix="/api/v1/volunteer", tags=["Volunteer QR Scanner"])

@router.post("/coupons/validate", response_model=ValidateCouponResponse)
def validate_coupon(
    payload: ValidateCouponRequest,
    volunteer: UserRole = Depends(require_volunteer),
    db: Session = Depends(get_db)
):
    """
    Looks up coupon by scanned QR token or manual code without redeeming.
    Returns student details and whether coupon is ACTIVE, REDEEMED, or REVOKED.
    """
    coupon = lookup_coupon(db, qr_token=payload.qr_token, coupon_code=payload.coupon_code)
    if not coupon:
        return ValidateCouponResponse(
            valid=False,
            status="NOT_FOUND",
            message="No coupon found matching the scanned QR code or coupon code."
        )

    redemption = coupon.redemption
    is_valid = coupon.status == "ACTIVE" and coupon.student.eligible_student.is_active

    return ValidateCouponResponse(
        valid=is_valid,
        status=coupon.status,
        message="Valid Active Coupon" if is_valid else f"Coupon is {coupon.status}",
        coupon_id=coupon.id,
        coupon_code=coupon.coupon_code,
        student_name=coupon.student.student_name,
        usn=coupon.student.usn,
        department=coupon.student.department,
        batch=coupon.student.batch,
        redeemed_at=redemption.redeemed_at if redemption else None,
        volunteer_name=redemption.volunteer_name if redemption else None
    )

@router.post("/coupons/redeem", response_model=RedeemCouponResponse)
def redeem_coupon(
    payload: RedeemCouponRequest,
    request: Request,
    volunteer: UserRole = Depends(require_volunteer),
    db: Session = Depends(get_db)
):
    """
    Atomically marks the food coupon as redeemed.
    Protects against duplicate scans, concurrent scans, and revoked passes.
    """
    result = redeem_coupon_atomically(
        db,
        volunteer=volunteer,
        qr_token=payload.qr_token,
        coupon_code=payload.coupon_code,
        counter_name=payload.counter_name or "Main Food Counter"
    )

    log_audit(
        db,
        action="COUPON_REDEMPTION_ATTEMPT",
        target_entity="food_coupons",
        target_id=result.get("coupon_id"),
        actor_id=volunteer.id,
        actor_email=volunteer.email,
        actor_role=volunteer.role,
        details={
            "result_status": result.get("status"),
            "usn": result.get("usn"),
            "volunteer_name": volunteer.full_name
        },
        ip_address=request.client.host if request.client else None
    )

    return RedeemCouponResponse(**result)

@router.get("/redemptions")
def get_volunteer_redemptions(
    volunteer: UserRole = Depends(require_volunteer),
    db: Session = Depends(get_db)
):
    """Returns recent redemptions performed by this volunteer."""
    records = db.query(Redemption).filter(
        Redemption.volunteer_id == volunteer.id
    ).order_by(Redemption.redeemed_at.desc()).limit(100).all()

    return [
        {
            "id": r.id,
            "coupon_code": r.coupon.coupon_code if r.coupon else "",
            "student_name": r.coupon.student.student_name if r.coupon and r.coupon.student else "",
            "usn": r.coupon.student.usn if r.coupon and r.coupon.student else "",
            "redeemed_at": r.redeemed_at,
            "counter_name": r.counter_name
        }
        for r in records
    ]

@router.get("/stats")
def get_volunteer_stats(
    volunteer: UserRole = Depends(require_volunteer),
    db: Session = Depends(get_db)
):
    """Volunteer's live scanning statistics."""
    count = db.query(Redemption).filter(Redemption.volunteer_id == volunteer.id).count()
    return {
        "volunteer_name": volunteer.full_name,
        "role": volunteer.role,
        "total_scanned": count
    }

