import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import OtpVerification
from app.config import settings
from app.security import mask_email

def generate_numeric_otp(length: int = 6) -> str:
    """Generate cryptographically secure 6-digit numeric OTP"""
    return "".join(str(secrets.randbelow(10)) for _ in range(length))

def send_email_otp(to_email: str, student_name: str, otp_code: str) -> bool:
    """Send OTP via SMTP if configured, otherwise log it"""
    if not settings.SMTP_SERVER or not settings.SMTP_USERNAME:
        print(f"[OTP SERVICE] (Dev Mode) OTP for {student_name} <{to_email}>: {otp_code}")
        return True
    
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"AAGAZZ 2K26 - Verification Passcode: {otp_code}"
        msg["From"] = f"AAGAZZ 2K26 <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email

        html_content = f"""
        <div style="background-color: #080604; color: #F8F2E8; padding: 32px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; text-align: center;">
            <div style="max-width: 480px; margin: 0 auto; background-color: #15100C; border: 1px solid #D9AC63; border-radius: 16px; padding: 24px;">
                <h1 style="color: #FFD78A; font-family: 'Playfair Display', serif; margin-bottom: 4px;">AAGAZZ 2K26</h1>
                <p style="color: #D9AC63; font-size: 13px; text-transform: uppercase; letter-spacing: 2px;">Department of AI & DS | SGBIT</p>
                <hr style="border: 0; border-top: 1px dashed #B88643; margin: 20px 0;">
                <p style="font-size: 15px; color: #E9E1DB;">Hello <strong>{student_name}</strong>,</p>
                <p style="font-size: 13px; color: #B9ADA0;">Your one-time passcode for claiming your official AAGAZZ 2K26 Food Coupon is:</p>
                <div style="background: #221F1B; border: 2px solid #FFD78A; border-radius: 12px; padding: 14px; margin: 24px auto; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #FFD78A; display: inline-block;">
                    {otp_code}
                </div>
                <p style="font-size: 12px; color: #B9ADA0;">This passcode expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
                <p style="font-size: 11px; color: #7C766B; margin-top: 24px;">S. G. Balekundri Institute of Technology, Belagavi</p>
            </div>
        </div>
        """
        msg.attach(MIMEText(html_content, "html"))

        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"[OTP SERVICE] SMTP delivery failed: {e}. Falling back to dev mode.")
        return False

def create_and_send_otp(db: Session, usn: str, email: str, student_name: str) -> tuple[bool, str, str]:
    """Generates, saves, and dispatches OTP. Returns (success, masked_email, otp_code)."""
    # Invalidate older unexpired OTPs for this USN
    db.query(OtpVerification).filter(
        OtpVerification.usn == usn,
        OtpVerification.is_used == False
    ).update({"is_used": True})
    
    otp_code = generate_numeric_otp(6)
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    otp_record = OtpVerification(
        usn=usn,
        email=email,
        otp_code=otp_code,
        expires_at=expires_at,
        is_used=False,
        attempts=0
    )
    db.add(otp_record)
    db.commit()
    
    send_email_otp(email, student_name, otp_code)
    masked = mask_email(email)
    return True, masked, otp_code

def verify_otp_code(db: Session, usn: str, entered_otp: str) -> tuple[bool, str]:
    """Validates submitted OTP code against active unexpired database record."""
    clean_otp = entered_otp.strip()
    now = datetime.utcnow()
    
    record = db.query(OtpVerification).filter(
        OtpVerification.usn == usn,
        OtpVerification.is_used == False,
        OtpVerification.expires_at >= now
    ).order_by(OtpVerification.created_at.desc()).first()
    
    if not record:
        return False, "Passcode has expired or does not exist. Please request a new code."
    
    record.attempts += 1
    if record.attempts > 5:
        record.is_used = True
        db.commit()
        return False, "Too many failed attempts. Passcode invalidated. Please request a new code."
    
    if record.otp_code != clean_otp:
        db.commit()
        return False, "Incorrect passcode. Please check your college email."
    
    # Valid OTP! Mark as used
    record.is_used = True
    db.commit()
    return True, "Verification successful."

