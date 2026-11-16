from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Any
from datetime import datetime, date, time

# Token
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str
    email: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# User Login
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# Event
class EventBase(BaseModel):
    title: str
    department: str
    college: str
    batch: str
    event_date: date
    start_time: time
    end_time: time
    venue: str
    is_registration_open: bool

class EventResponse(EventBase):
    id: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class EventUpdate(BaseModel):
    title: Optional[str] = None
    venue: Optional[str] = None
    event_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    is_registration_open: Optional[bool] = None

class RegistrationControlUpdate(BaseModel):
    is_registration_open: bool

# Eligibility & OTP
class EligibilityCheckRequest(BaseModel):
    usn: str

class EligibilityCheckResponse(BaseModel):
    status: str # "ELIGIBLE", "INVALID_USN", "ALREADY_REGISTERED", "REGISTRATION_CLOSED", "INACTIVE"
    message: str
    student_name: Optional[str] = None
    masked_email: Optional[str] = None
    usn: Optional[str] = None
    department: Optional[str] = None
    has_existing_coupon: bool = False
    coupon_id: Optional[str] = None

class SendOtpRequest(BaseModel):
    usn: str

class SendOtpResponse(BaseModel):
    success: bool
    message: str
    masked_email: str
    expires_in_seconds: int = 300
    dev_otp: Optional[str] = None # Present only in dev mode for testing!

class VerifyIdentityRequest(BaseModel):
    usn: str
    otp: str

class VerifyIdentityResponse(BaseModel):
    success: bool
    message: str
    access_token: str
    token_type: str = "bearer"
    student_id: str
    usn: str
    student_name: str
    email: str
    department: str
    has_coupon: bool = False

# Direct Student Ticket Access (Common Event Passcode)
class ClaimTicketRequest(BaseModel):
    usn: str
    access_code: str

class ClaimTicketResponse(BaseModel):
    success: bool
    message: str
    access_token: str
    token_type: str = "bearer"
    coupon_id: str
    coupon_code: str
    qr_token: str
    status: str
    student_name: str
    usn: str
    department: str
    batch: str
    created_at: datetime
    redeemed_at: Optional[datetime] = None
    volunteer_name: Optional[str] = None

# Student Registration
class StudentRegisterRequest(BaseModel):
    usn: str

# Food Coupon
class FoodCouponResponse(BaseModel):
    coupon_id: str
    coupon_code: str
    qr_token: Optional[str] = None # Secure random token passed to client for QR generation
    status: str # ACTIVE, REDEEMED, REVOKED
    student_name: str
    usn: str
    department: str
    batch: str
    created_at: datetime
    redeemed_at: Optional[datetime] = None
    volunteer_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# Volunteer Scanner
class ValidateCouponRequest(BaseModel):
    qr_token: Optional[str] = None
    coupon_code: Optional[str] = None

class ValidateCouponResponse(BaseModel):
    valid: bool
    status: str # "ACTIVE", "REDEEMED", "REVOKED", "NOT_FOUND"
    message: str
    coupon_id: Optional[str] = None
    coupon_code: Optional[str] = None
    student_name: Optional[str] = None
    usn: Optional[str] = None
    department: Optional[str] = None
    batch: Optional[str] = None
    redeemed_at: Optional[datetime] = None
    volunteer_name: Optional[str] = None

class RedeemCouponRequest(BaseModel):
    qr_token: Optional[str] = None
    coupon_code: Optional[str] = None
    counter_name: Optional[str] = "Main Food Counter"

class RedeemCouponResponse(BaseModel):
    success: bool
    status: str # "SUCCESS", "ALREADY_REDEEMED", "REVOKED", "NOT_FOUND"
    message: str
    coupon_id: Optional[str] = None
    coupon_code: Optional[str] = None
    student_name: Optional[str] = None
    usn: Optional[str] = None
    volunteer_name: Optional[str] = None
    redeemed_at: Optional[datetime] = None

# Admin Student Management
class EligibleStudentResponse(BaseModel):
    id: str
    usn: str
    student_name: str
    email: Optional[str] = None
    department: str
    year: int
    is_active: bool
    is_registered: bool
    coupon_status: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ImportSummaryResponse(BaseModel):
    total_records: int
    valid_records: int
    imported_records: int
    duplicate_records: int
    invalid_records: int
    errors: List[dict] = []

class ToggleStudentStatusRequest(BaseModel):
    is_active: bool

class RevokeCouponRequest(BaseModel):
    reason: str

# Volunteers
class CreateVolunteerRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class VolunteerResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    redemption_count: int = 0
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Admin Analytics
class AnalyticsResponse(BaseModel):
    total_eligible_students: int
    total_registered_students: int
    total_coupons_generated: int
    active_coupons: int
    redeemed_coupons: int
    revoked_coupons: int
    remaining_coupons: int
    registration_open: bool
    hourly_redemptions: List[dict] = []
