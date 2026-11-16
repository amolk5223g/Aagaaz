import bcrypt
import hashlib
import secrets
import jwt
from datetime import datetime, timedelta
from typing import Optional
from app.config import settings

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception:
        return None

def generate_secure_token() -> str:
    """Generate cryptographically secure random token (URL safe 32 bytes)"""
    return secrets.token_urlsafe(32)

def hash_qr_token(token: str) -> str:
    """Never store raw QR token in database. Store SHA-256 hash."""
    return hashlib.sha256(token.encode('utf-8')).hexdigest()

def normalize_usn(usn: str) -> str:
    """Normalizes USN to uppercase and removes all whitespace"""
    if not usn:
        return ""
    return usn.strip().upper().replace(" ", "")

def mask_email(email: str) -> str:
    """Converts student@sgbit.edu.in to s***t@sgbit.edu.in for privacy"""
    if not email or "@" not in email:
        return email
    username, domain = email.split("@", 1)
    if len(username) <= 2:
        masked_user = username[0] + "***"
    else:
        masked_user = username[0] + "***" + username[-1]
    return f"{masked_user}@{domain}"

