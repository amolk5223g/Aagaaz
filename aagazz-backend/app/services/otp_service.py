import secrets
import smtplib
import hashlib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import OtpVerification
from app.config import settings
from app.security import mask_email
from app.services.brevo_service import send_brevo_otp

def hash_otp(code: str) -> str:
    """Computes SHA-256 hash of the OTP for secure database storage."""
    return hashlib.sha256(code.strip().encode("utf-8")).hexdigest()

def generate_numeric_otp(length: int = 6) -> str:
    """Generate cryptographically secure 6-digit numeric OTP."""
    return "".join(str(secrets.randbelow(10)) for _ in range(length))

def send_email_otp(to_email: str, student_name: str, usn: str, otp_code: str) -> bool:
    """
    Sends OTP via Brevo Transactional Email API with multi-key failover and retries.
    Falls back gracefully if SMTP or Brevo is unreachable.
    """
    success, info = send_brevo_otp(to_email=to_email, student_name=student_name, usn=usn, otp_code=otp_code)
    return success

def create_and_send_otp(db: Session, usn: str, email: str, student_name: str) -> tuple[bool, str, str | None, int]:
    """
    Generates, securely hashes, saves, and dispatches OTP.
    Enforces a 60-second cooldown on resends.
    Returns (success, message_or_masked_email, plain_otp_code_if_success, cooldown_seconds).
    """
    now = datetime.utcnow()
    
    # Check cooldown: last unused OTP requested within 60 seconds
    recent_otp = db.query(OtpVerification).filter(
        OtpVerification.usn == usn,
        OtpVerification.is_used == False,
        OtpVerification.expires_at >= now
    ).order_by(OtpVerification.created_at.desc()).first()

    if recent_otp:
        elapsed = (now - recent_otp.created_at).total_seconds()
        if elapsed < 60:
            remaining = int(60 - elapsed)
            return False, f"Please wait {remaining} seconds before requesting a new OTP.", None, remaining

    # Invalidate older active OTPs for this USN
    db.query(OtpVerification).filter(
        OtpVerification.usn == usn,
        OtpVerification.is_used == False
    ).update({"is_used": True})
    
    otp_code = generate_numeric_otp(6)
    hashed_code = hash_otp(otp_code)
    expires_at = now + timedelta(minutes=5)
    
    otp_record = OtpVerification(
        usn=usn,
        email=email,
        otp_code=hashed_code, # Securely store SHA-256 hash, NEVER plain text
        expires_at=expires_at,
        is_used=False,
        attempts=0
    )
    db.add(otp_record)
    db.commit()
    
    send_email_otp(to_email=email, student_name=student_name, usn=usn, otp_code=otp_code)
    masked = mask_email(email)
    return True, masked, otp_code, 60

def verify_otp_code(db: Session, usn: str, entered_otp: str) -> tuple[bool, str]:
    """
    Validates submitted OTP code against active unexpired database record.
    Compares SHA-256 hashes.
    Limits incorrect attempts to 5 and invalidates OTP after successful verification.
    """
    clean_otp = entered_otp.strip()
    if len(clean_otp) != 6 or not clean_otp.isdigit():
        return False, "Please enter a valid 6-digit numeric passcode."

    now = datetime.utcnow()
    
    record = db.query(OtpVerification).filter(
        OtpVerification.usn == usn,
        OtpVerification.is_used == False,
        OtpVerification.expires_at >= now
    ).order_by(OtpVerification.created_at.desc()).first()
    
    if not record:
        return False, "Passcode has expired or does not exist. Please request a new OTP."
    
    record.attempts += 1
    if record.attempts > 5:
        record.is_used = True
        db.commit()
        return False, "Too many failed attempts. Passcode invalidated. Please request a new OTP."
    
    expected_hash = hash_otp(clean_otp)
    if record.otp_code != expected_hash:
        db.commit()
        remaining_attempts = max(0, 5 - record.attempts)
        return False, f"Incorrect passcode. {remaining_attempts} attempt(s) remaining."
    
    # Valid OTP! Mark as used to prevent replay/reuse
    record.is_used = True
    db.commit()
    return True, "Verification successful."

