from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models import UserRole, Student
from app.security import decode_access_token

security_scheme = HTTPBearer(auto_error=False)

def get_current_user_token_payload(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

def get_current_admin_or_volunteer(
    payload: dict = Depends(get_current_user_token_payload),
    db: Session = Depends(get_db)
) -> UserRole:
    role = payload.get("role")
    email = payload.get("sub")
    if role not in ["ADMIN", "VOLUNTEER"] or not email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to authorized personnel"
        )
    user = db.query(UserRole).filter(UserRole.email == email, UserRole.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account inactive or not found"
        )
    return user

def require_admin(user: UserRole = Depends(get_current_admin_or_volunteer)) -> UserRole:
    if user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required"
        )
    return user

def require_volunteer(user: UserRole = Depends(get_current_admin_or_volunteer)) -> UserRole:
    if user.role not in ["ADMIN", "VOLUNTEER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Volunteer permissions required"
        )
    return user

def get_current_student(
    payload: dict = Depends(get_current_user_token_payload),
    db: Session = Depends(get_db)
) -> Student:
    role = payload.get("role")
    usn = payload.get("usn")
    if role != "STUDENT" or not usn:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student authentication required"
        )
    student = db.query(Student).filter(Student.usn == usn).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registered student record not found"
        )
    return student

