-- Row Level Security (RLS) Policies for AAGAZZ 2K26
-- Supabase PostgreSQL

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligible_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Events: Public read access for active event details
CREATE POLICY "Public can view active events" 
ON events FOR SELECT 
USING (true);

-- 2. User Roles: Restricted to service-role or backend admin calls
CREATE POLICY "Admins can view and manage user roles" 
ON user_roles FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'ADMIN');

-- 3. Eligible Students:
CREATE POLICY "Public cannot read entire whitelist"
ON eligible_students FOR SELECT
TO anon
USING (false);

CREATE POLICY "Admins can manage eligible students"
ON eligible_students FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'ADMIN');

-- 4. Food Coupons:
CREATE POLICY "Students can view only their own coupon"
ON food_coupons FOR SELECT
TO authenticated
USING (student_id IN (
    SELECT id FROM students WHERE auth_user_id = auth.uid()::text
));

CREATE POLICY "Volunteers and Admins can view coupons for validation"
ON food_coupons FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' IN ('ADMIN', 'VOLUNTEER'));

-- 5. Redemptions:
CREATE POLICY "Volunteers and Admins can create and view redemptions"
ON redemptions FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' IN ('ADMIN', 'VOLUNTEER'));

-- 6. Audit Logs:
CREATE POLICY "Admins can read audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'role' = 'ADMIN');

