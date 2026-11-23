-- AAGAZZ 2K26 Database Schema
-- Supabase PostgreSQL Compatible

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Events Table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL DEFAULT 'AAGAZZ 2K26',
    department VARCHAR(100) NOT NULL DEFAULT 'AI & DS',
    college VARCHAR(255) NOT NULL DEFAULT 'S. G. Balekundri Institute of Technology, Belagavi',
    batch VARCHAR(50) NOT NULL DEFAULT '2025–29',
    event_date DATE NOT NULL DEFAULT '2026-02-26',
    start_time TIME NOT NULL DEFAULT '10:00:00',
    end_time TIME NOT NULL DEFAULT '14:00:00',
    venue VARCHAR(255) NOT NULL DEFAULT 'C102, Department of AI & DS',
    is_registration_open BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Roles Table (Admin, Volunteer)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'VOLUNTEER')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Whitelisted Eligible Students Table (Imported by Admin)
CREATE TABLE IF NOT EXISTS eligible_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usn VARCHAR(50) UNIQUE NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL DEFAULT 'AI & DS',
    year INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_registered BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index on USN and Email for fast lookup
CREATE INDEX IF NOT EXISTS idx_eligible_students_usn ON eligible_students (usn);
CREATE INDEX IF NOT EXISTS idx_eligible_students_email ON eligible_students (email);

-- 4. OTP Verification Records
CREATE TABLE IF NOT EXISTS otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usn VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    attempts INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otp_usn ON otp_verifications (usn);

-- 5. Registered Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eligible_student_id UUID UNIQUE NOT NULL REFERENCES eligible_students(id) ON DELETE RESTRICT,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    usn VARCHAR(50) UNIQUE NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL DEFAULT 'AI & DS',
    batch VARCHAR(50) NOT NULL DEFAULT '2025–29',
    auth_user_id VARCHAR(255) NULL,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_event UNIQUE (usn, event_id)
);

-- 6. Food Coupons Table
CREATE TABLE IF NOT EXISTS food_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID UNIQUE NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    coupon_code VARCHAR(100) UNIQUE NOT NULL,
    qr_token_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 hash of random token
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REDEEMED', 'REVOKED')),
    revocation_reason TEXT NULL,
    revoked_at TIMESTAMPTZ NULL,
    revoked_by VARCHAR(255) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_coupon_student_event UNIQUE (student_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_food_coupons_qr_hash ON food_coupons (qr_token_hash);
CREATE INDEX IF NOT EXISTS idx_food_coupons_coupon_code ON food_coupons (coupon_code);

-- 7. Redemptions Table
CREATE TABLE IF NOT EXISTS redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID UNIQUE NOT NULL REFERENCES food_coupons(id) ON DELETE RESTRICT,
    volunteer_id UUID NOT NULL REFERENCES user_roles(id),
    volunteer_name VARCHAR(255) NOT NULL,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    counter_name VARCHAR(100) DEFAULT 'Main Counter'
);

CREATE INDEX IF NOT EXISTS idx_redemptions_coupon_id ON redemptions (coupon_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_volunteer_id ON redemptions (volunteer_id);

-- 8. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id VARCHAR(255) NULL,
    actor_email VARCHAR(255) NULL,
    actor_role VARCHAR(50) NULL,
    action VARCHAR(100) NOT NULL,
    target_entity VARCHAR(100) NOT NULL,
    target_id VARCHAR(255) NULL,
    details JSONB NULL,
    ip_address VARCHAR(100) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);

