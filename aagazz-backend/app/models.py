import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, DateTime, Date, Time, Integer, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Event(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False, default="AAGAZZ 2K26")
    department = Column(String(100), nullable=False, default="AI & DS")
    college = Column(String(255), nullable=False, default="S. G. Balekundri Institute of Technology, Belagavi")
    batch = Column(String(50), nullable=False, default="2025–29")
    event_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    venue = Column(String(255), nullable=False, default="C102, Department of AI & DS")
    is_registration_open = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    students = relationship("Student", back_populates="event")
    coupons = relationship("FoodCoupon", back_populates="event")


class UserRole(Base):
    __tablename__ = "user_roles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False) # 'ADMIN' or 'VOLUNTEER'
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    redemptions = relationship("Redemption", back_populates="volunteer")


class EligibleStudent(Base):
    __tablename__ = "eligible_students"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    usn = Column(String(50), unique=True, nullable=False, index=True)
    student_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True, index=True)
    department = Column(String(100), nullable=False, default="AI & DS")
    year = Column(Integer, nullable=False, default=1)
    is_active = Column(Boolean, nullable=False, default=True)
    is_registered = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("Student", back_populates="eligible_student", uselist=False)


class OtpVerification(Base):
    __tablename__ = "otp_verifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    usn = Column(String(50), nullable=False, index=True)
    email = Column(String(255), nullable=False)
    otp_code = Column(String(10), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, nullable=False, default=False)
    attempts = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class Student(Base):
    __tablename__ = "students"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    eligible_student_id = Column(String(36), ForeignKey("eligible_students.id"), unique=True, nullable=False)
    event_id = Column(String(36), ForeignKey("events.id"), nullable=False)
    usn = Column(String(50), unique=True, nullable=False, index=True)
    student_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    department = Column(String(100), nullable=False, default="AI & DS")
    batch = Column(String(50), nullable=False, default="2025–29")
    auth_user_id = Column(String(255), nullable=True)
    registered_at = Column(DateTime, default=datetime.utcnow)

    eligible_student = relationship("EligibleStudent", back_populates="student")
    event = relationship("Event", back_populates="students")
    coupon = relationship("FoodCoupon", back_populates="student", uselist=False)


class FoodCoupon(Base):
    __tablename__ = "food_coupons"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id"), unique=True, nullable=False)
    event_id = Column(String(36), ForeignKey("events.id"), nullable=False)
    coupon_code = Column(String(100), unique=True, nullable=False, index=True)
    qr_token_hash = Column(String(64), unique=True, nullable=False, index=True)
    status = Column(String(50), nullable=False, default="ACTIVE") # ACTIVE, REDEEMED, REVOKED
    revocation_reason = Column(Text, nullable=True)
    revoked_at = Column(DateTime, nullable=True)
    revoked_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("Student", back_populates="coupon")
    event = relationship("Event", back_populates="coupons")
    redemption = relationship("Redemption", back_populates="coupon", uselist=False)


class Redemption(Base):
    __tablename__ = "redemptions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    coupon_id = Column(String(36), ForeignKey("food_coupons.id"), unique=True, nullable=False, index=True)
    volunteer_id = Column(String(36), ForeignKey("user_roles.id"), nullable=False, index=True)
    volunteer_name = Column(String(255), nullable=False)
    redeemed_at = Column(DateTime, default=datetime.utcnow)
    counter_name = Column(String(100), default="Main Food Counter")

    coupon = relationship("FoodCoupon", back_populates="redemption")
    volunteer = relationship("UserRole", back_populates="redemptions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    actor_id = Column(String(255), nullable=True)
    actor_email = Column(String(255), nullable=True)
    actor_role = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    target_entity = Column(String(100), nullable=False)
    target_id = Column(String(255), nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

