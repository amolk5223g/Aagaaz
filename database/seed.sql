-- Seed Data for AAGAZZ 2K26
-- Official Event & Staff Roles Only (No dummy student data; admin uploads via portal)

-- 1. Insert Event
INSERT INTO events (id, title, department, college, batch, event_date, start_time, end_time, venue, is_registration_open)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'AAGAZZ 2K26',
    'AI & DS',
    'S. G. Balekundri Institute of Technology, Belagavi',
    '2025–29',
    '2026-11-20',
    '10:00:00',
    '14:00:00',
    'C102, Department of AI & DS',
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- 2. Insert Default Admin and Volunteer (Password: 'Aagazz@2026' and 'Volunteer@2026')
INSERT INTO user_roles (id, email, hashed_password, full_name, role, is_active)
VALUES 
(
    'b0000000-0000-0000-0000-000000000001',
    'admin@sgbit.edu.in',
    '$2b$12$eXAMPLeHashedPasswordAagazz2026ForTestingOnlyAdminPlaceholder',
    'Prof. Neha Jadhav (Admin)',
    'ADMIN',
    TRUE
),
(
    'b0000000-0000-0000-0000-000000000002',
    'volunteer@sgbit.edu.in',
    '$2b$12$eXAMPLeHashedPasswordVolunteer2026PlaceholderForTesting',
    'Shubham Kadam (Volunteer)',
    'VOLUNTEER',
    TRUE
) ON CONFLICT (email) DO NOTHING;
