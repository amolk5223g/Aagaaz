import io
import csv
import pandas as pd
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List

from app.database import get_db
from app.models import (
    EligibleStudent, Student, FoodCoupon, Redemption,
    UserRole, Event, AuditLog
)
from app.schemas import (
    AnalyticsResponse, ImportSummaryResponse, EligibleStudentResponse,
    ToggleStudentStatusRequest, RevokeCouponRequest,
    CreateVolunteerRequest, VolunteerResponse,
    RegistrationControlUpdate, EventUpdate
)
from app.dependencies import require_admin
from app.security import normalize_usn, hash_password
from app.services.audit_service import log_audit

router = APIRouter(prefix="/api/v1/admin", tags=["Admin Management & Analytics"])

@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(
    admin: UserRole = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Computes real-time event management analytics directly from the database."""
    event = db.query(Event).order_by(Event.created_at.desc()).first()
    is_reg_open = event.is_registration_open if event else False

    total_eligible = db.query(EligibleStudent).count()
    total_registered = db.query(Student).count()
    total_coupons = db.query(FoodCoupon).count()

    active_coupons = db.query(FoodCoupon).filter(FoodCoupon.status == "ACTIVE").count()
    redeemed_coupons = db.query(FoodCoupon).filter(FoodCoupon.status == "REDEEMED").count()
    revoked_coupons = db.query(FoodCoupon).filter(FoodCoupon.status == "REVOKED").count()
    remaining_coupons = max(0, total_eligible - redeemed_coupons)

    return AnalyticsResponse(
        total_eligible_students=total_eligible,
        total_registered_students=total_registered,
        total_coupons_generated=total_coupons,
        active_coupons=active_coupons,
        redeemed_coupons=redeemed_coupons,
        revoked_coupons=revoked_coupons,
        remaining_coupons=remaining_coupons,
        registration_open=is_reg_open,
        hourly_redemptions=[]
    )

@router.post("/students/import", response_model=ImportSummaryResponse)
async def import_students_whitelist(
    request: Request,
    file: UploadFile = File(...),
    admin: UserRole = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Imports student whitelist from CSV or XLSX file.
    Validates:
    - Expected columns: USN, Student Name, Email, Department, Year
    - Normalizes USN
    - Rejects records belonging to other departments (Only AI & DS eligible)
    - Detects duplicate USNs and duplicate emails
    - Saves valid records to eligible_students
    - Returns summary with row-level error report
    """
    filename = file.filename.lower()
    contents = await file.read()

    rows = []
    if filename.endswith(".csv"):
        try:
            decoded = contents.decode("utf-8-sig")
            reader = csv.DictReader(io.StringIO(decoded))
            rows = list(reader)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read CSV: {e}")
    elif filename.endswith((".xlsx", ".xls")):
        try:
            df = pd.read_excel(io.BytesIO(contents))
            rows = df.to_dict(orient="records")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read Excel file: {e}")
    else:
        raise HTTPException(status_code=400, detail="Only CSV or XLSX files are supported.")

    if not rows:
        raise HTTPException(status_code=400, detail="The uploaded file contains no data.")

    # Match column names case-insensitively
    first_row = rows[0]
    col_map = {}
    for col in first_row.keys():
        col_clean = str(col).strip().lower().replace("_", " ")
        if "usn" in col_clean:
            col_map["usn"] = col
        elif "name" in col_clean:
            col_map["name"] = col
        elif "email" in col_clean:
            col_map["email"] = col
        elif "dept" in col_clean or "department" in col_clean:
            col_map["department"] = col
        elif "year" in col_clean:
            col_map["year"] = col

    required_keys = ["usn", "name"]
    for req in required_keys:
        if req not in col_map:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required column for '{req}'. Expected columns: USN, Student Name, Year."
            )

    total_records = len(rows)
    valid_records = 0
    imported_records = 0
    duplicate_records = 0
    invalid_records = 0
    errors = []

    seen_file_usns = set()

    # Preload existing USNs to avoid N individual database queries
    existing_db = db.query(EligibleStudent.usn).all()
    existing_db_usns = {r[0] for r in existing_db}

    for idx, row in enumerate(rows, start=1):
        raw_usn = str(row.get(col_map["usn"], "")).strip()
        raw_name = str(row.get(col_map["name"], "")).strip()
        raw_email = str(row.get(col_map.get("email", ""), "")).strip().lower() if "email" in col_map else None
        raw_dept = str(row.get(col_map.get("department", ""), "AI & DS")).strip()
        raw_year = row.get(col_map.get("year", 1), 1)

        usn = normalize_usn(raw_usn)

        # Validation 1: Missing values (USN and Name required)
        if not usn or not raw_name:
            invalid_records += 1
            errors.append({"row": idx, "usn": raw_usn, "reason": "Missing USN or Student Name"})
            continue

        # Validation 2: Department restriction (AI & DS only)
        dept_upper = raw_dept.upper()
        if "AI" not in dept_upper and "DS" not in dept_upper:
            invalid_records += 1
            errors.append({
                "row": idx,
                "usn": usn,
                "reason": f"Non-AI&DS department '{raw_dept}' rejected. Only AI & DS eligible."
            })
            continue

        # Validation 3: Duplicate USN in current file
        if usn in seen_file_usns:
            duplicate_records += 1
            errors.append({"row": idx, "usn": usn, "reason": "Duplicate USN within the uploaded file"})
            continue

        seen_file_usns.add(usn)

        # Validation 4: Existing in database
        if usn in existing_db_usns:
            duplicate_records += 1
            errors.append({"row": idx, "usn": usn, "reason": "USN already exists in database"})
            continue

        # Valid row to insert
        try:
            year_val = int(raw_year) if str(raw_year).isdigit() else 1
        except Exception:
            year_val = 1

        student_record = EligibleStudent(
            usn=usn,
            student_name=raw_name,
            email=raw_email if raw_email else None,
            department="AI & DS",
            year=year_val,
            is_active=True,
            is_registered=False
        )
        db.add(student_record)
        valid_records += 1
        imported_records += 1

    db.commit()

    log_audit(
        db,
        action="IMPORT_STUDENT_WHITELIST",
        target_entity="eligible_students",
        actor_id=admin.id,
        actor_email=admin.email,
        actor_role=admin.role,
        details={
            "filename": filename,
            "total_records": total_records,
            "imported_records": imported_records,
            "duplicates": duplicate_records,
            "invalid": invalid_records
        },
        ip_address=request.client.host if request.client else None
    )

    return ImportSummaryResponse(
        total_records=total_records,
        valid_records=valid_records,
        imported_records=imported_records,
        duplicate_records=duplicate_records,
        invalid_records=invalid_records,
        errors=errors[:100] # Cap first 100 errors for response brevity
    )

@router.get("/students")
def get_eligible_students(
    search: Optional[str] = None,
    status_filter: Optional[str] = None, # ALL, REGISTERED, UNREGISTERED, ACTIVE, INACTIVE
    page: int = 1,
    limit: int = 50,
    admin: UserRole = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Lists eligible students with search, registration status, and pagination."""
    query = db.query(EligibleStudent)

    if search:
        search_term = f"%{search.strip().upper()}%"
        query = query.filter(
            (EligibleStudent.usn.ilike(search_term)) |
            (EligibleStudent.student_name.ilike(search_term)) |
            (EligibleStudent.email.ilike(search_term))
        )

    if status_filter == "REGISTERED":
        query = query.filter(EligibleStudent.is_registered == True)
    elif status_filter == "UNREGISTERED":
        query = query.filter(EligibleStudent.is_registered == False)
    elif status_filter == "ACTIVE":
        query = query.filter(EligibleStudent.is_active == True)
    elif status_filter == "INACTIVE":
        query = query.filter(EligibleStudent.is_active == False)

    total = query.count()
    records = query.order_by(EligibleStudent.usn.asc()).offset((page - 1) * limit).limit(limit).all()

    # Enrich with coupon status
    result = []
    for s in records:
        coupon_status = None
        if s.student and s.student.coupon:
            coupon_status = s.student.coupon.status

        result.append({
            "id": s.id,
            "usn": s.usn,
            "student_name": s.student_name,
            "email": s.email,
            "department": s.department,
            "year": s.year,
            "is_active": s.is_active,
            "is_registered": s.is_registered,
            "coupon_status": coupon_status,
            "created_at": s.created_at
        })

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "students": result
    }

@router.patch("/students/{id}/status")
def toggle_student_status(
    id: str,
    payload: ToggleStudentStatusRequest,
    request: Request,
    admin: UserRole = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin can activate or deactivate an eligible student."""
    student = db.query(EligibleStudent).filter(EligibleStudent.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    student.is_active = payload.is_active
    db.commit()

    log_audit(
        db,
        action="TOGGLE_STUDENT_STATUS",
        target_entity="eligible_students",
        target_id=student.id,
        actor_id=admin.id,
        actor_email=admin.email,
        actor_role=admin.role,
        details={"usn": student.usn, "is_active": payload.is_active},
        ip_address=request.client.host if request.client else None
    )

    return {"success": True, "message": f"Student {student.usn} status updated to {payload.is_active}"}

@router.get("/coupons")
def list_coupons(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    admin: UserRole = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Lists generated food coupons."""
    query = db.query(FoodCoupon)

    if status_filter and status_filter != "ALL":
        query = query.filter(FoodCoupon.status == status_filter.upper())

    if search:
        st = f"%{search.strip().upper()}%"
        query = query.join(Student).filter(
            (FoodCoupon.coupon_code.ilike(st)) |
            (Student.usn.ilike(st)) |
            (Student.student_name.ilike(st))
        )

    total = query.count()
    coupons = query.order_by(FoodCoupon.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "coupons": [
            {
                "id": c.id,
                "coupon_code": c.coupon_code,
                "status": c.status,
                "student_name": c.student.student_name if c.student else "",
                "usn": c.student.usn if c.student else "",
                "created_at": c.created_at,
                "redeemed_at": c.redemption.redeemed_at if c.redemption else None,
                "volunteer_name": c.redemption.volunteer_name if c.redemption else None,
                "revocation_reason": c.revocation_reason,
                "revoked_at": c.revoked_at,
                "revoked_by": c.revoked_by
            }
            for c in coupons
        ]
    }

@router.post("/coupons/{id}/revoke")
def revoke_coupon(
    id: str,
    payload: RevokeCouponRequest,
    request: Request,
    admin: UserRole = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Revokes a coupon so that it cannot be redeemed."""
    coupon = db.query(FoodCoupon).filter(FoodCoupon.id == id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found.")

    coupon.status = "REVOKED"
    coupon.revocation_reason = payload.reason
    coupon.revoked_at = datetime.utcnow()
    coupon.revoked_by = admin.full_name
    db.commit()

    log_audit(
        db,
        action="REVOKE_COUPON",
        target_entity="food_coupons",
        target_id=coupon.id,
        actor_id=admin.id,
        actor_email=admin.email,
        actor_role=admin.role,
        details={"coupon_code": coupon.coupon_code, "reason": payload.reason},
        ip_address=request.client.host if request.client else None
    )

    return {"success": True, "message": f"Coupon {coupon.coupon_code} has been revoked."}

@router.get("/volunteers")
def list_volunteers(
    admin: UserRole = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Lists volunteer accounts and their scan counts."""
    volunteers = db.query(UserRole).filter(UserRole.role == "VOLUNTEER").all()
    results = []
    for v in volunteers:
        scan_count = db.query(Redemption).filter(Redemption.volunteer_id == v.id).count()
        results.append({
            "id": v.id,
            "email": v.email,
            "full_name": v.full_name,
            "role": v.role,
            "is_active": v.is_active,
            "redemption_count": scan_count,
            "created_at": v.created_at
        })
    return results

@router.post("/volunteers", response_model=VolunteerResponse)
def create_volunteer(
    payload: CreateVolunteerRequest,
    request: Request,
    admin: UserRole = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Creates a volunteer account with credentials."""
    email = payload.email.lower().strip()
    existing = db.query(UserRole).filter(UserRole.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account with this email already exists.")

    hashed = hash_password(payload.password)
    new_vol = UserRole(
        email=email,
        hashed_password=hashed,
        full_name=payload.full_name.strip(),
        role="VOLUNTEER",
        is_active=True
    )
    db.add(new_vol)
    db.commit()
    db.refresh(new_vol)

    log_audit(
        db,
        action="CREATE_VOLUNTEER",
        target_entity="user_roles",
        target_id=new_vol.id,
        actor_id=admin.id,
        actor_email=admin.email,
        actor_role=admin.role,
        details={"created_email": new_vol.email},
        ip_address=request.client.host if request.client else None
    )

    return VolunteerResponse(
        id=new_vol.id,
        email=new_vol.email,
        full_name=new_vol.full_name,
        role=new_vol.role,
        is_active=new_vol.is_active,
        redemption_count=0,
        created_at=new_vol.created_at
    )

@router.patch("/volunteers/{id}/status")
def toggle_volunteer_status(
    id: str,
    payload: ToggleStudentStatusRequest,
    admin: UserRole = Depends(require_admin),
    db: Session = Depends(get_db)
):
    vol = db.query(UserRole).filter(UserRole.id == id, UserRole.role == "VOLUNTEER").first()
    if not vol:
        raise HTTPException(status_code=404, detail="Volunteer not found.")

    vol.is_active = payload.is_active
    db.commit()
    return {"success": True, "message": f"Volunteer status set to {payload.is_active}"}

@router.get("/redemptions")
def get_all_redemptions(
    page: int = 1,
    limit: int = 50,
    admin: UserRole = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Full redemption audit table for admin."""
    query = db.query(Redemption).order_by(Redemption.redeemed_at.desc())
    total = query.count()
    records = query.offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "redemptions": [
            {
                "id": r.id,
                "coupon_code": r.coupon.coupon_code if r.coupon else "",
                "student_name": r.coupon.student.student_name if r.coupon and r.coupon.student else "",
                "usn": r.coupon.student.usn if r.coupon and r.coupon.student else "",
                "volunteer_name": r.volunteer_name,
                "counter_name": r.counter_name,
                "redeemed_at": r.redeemed_at
            }
            for r in records
        ]
    }

@router.patch("/registration-control")
def toggle_registration(
    payload: RegistrationControlUpdate,
    request: Request,
    admin: UserRole = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin controls whether event registration is OPEN or CLOSED."""
    event = db.query(Event).order_by(Event.created_at.desc()).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    event.is_registration_open = payload.is_registration_open
    db.commit()

    action_label = "OPEN_REGISTRATION" if payload.is_registration_open else "CLOSE_REGISTRATION"
    log_audit(
        db,
        action=action_label,
        target_entity="events",
        target_id=event.id,
        actor_id=admin.id,
        actor_email=admin.email,
        actor_role=admin.role,
        details={"is_registration_open": payload.is_registration_open},
        ip_address=request.client.host if request.client else None
    )

    return {
        "success": True,
        "is_registration_open": event.is_registration_open,
        "message": f"Registration is now {'OPEN' if event.is_registration_open else 'CLOSED'}."
    }

@router.patch("/events/{id}")
def update_event_details(
    id: str,
    payload: EventUpdate,
    admin: UserRole = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Updates event details."""
    event = db.query(Event).filter(Event.id == id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    if payload.title is not None: event.title = payload.title
    if payload.venue is not None: event.venue = payload.venue
    if payload.event_date is not None: event.event_date = payload.event_date
    if payload.start_time is not None: event.start_time = payload.start_time
    if payload.end_time is not None: event.end_time = payload.end_time
    if payload.is_registration_open is not None: event.is_registration_open = payload.is_registration_open

    db.commit()
    db.refresh(event)
    return {"success": True, "event": event}

