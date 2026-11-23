export type UserRoleType = 'ADMIN' | 'VOLUNTEER';

export interface AuthUser {
  token: string;
  role: UserRoleType;
  email: string;
  fullName: string;
}

export interface AnalyticsData {
  total_eligible_students: number;
  total_registered_students: number;
  total_coupons_generated: number;
  active_coupons: number;
  redeemed_coupons: number;
  revoked_coupons: number;
  remaining_coupons: number;
  registration_open: boolean;
  hourly_redemptions: { hour: string; count: number }[];
}

export interface EligibleStudentItem {
  id: string;
  usn: string;
  student_name: string;
  email: string;
  department: string;
  year: number;
  is_active: boolean;
  is_registered: boolean;
  coupon_status?: string | null;
  created_at: string;
}

export interface FoodCouponItem {
  id: string;
  coupon_code: string;
  status: 'ACTIVE' | 'REDEEMED' | 'REVOKED';
  student_name: string;
  usn: string;
  created_at: string;
  redeemed_at?: string | null;
  volunteer_name?: string | null;
  revocation_reason?: string | null;
  revoked_at?: string | null;
  revoked_by?: string | null;
}

export interface VolunteerItem {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  redemption_count: number;
  created_at: string;
}

export interface ImportSummary {
  total_records: number;
  valid_records: number;
  imported_records: number;
  duplicate_records: number;
  invalid_records: number;
  errors: { row: number; usn: string; reason: string }[];
}

export interface ScannerRedemptionResult {
  success: boolean;
  status: 'SUCCESS' | 'ALREADY_REDEEMED' | 'REVOKED' | 'NOT_FOUND';
  message: string;
  coupon_id?: string;
  coupon_code?: string;
  student_name?: string;
  usn?: string;
  volunteer_name?: string;
  redeemed_at?: string;
}

