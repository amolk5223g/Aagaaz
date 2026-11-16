export interface EventData {
  id: string;
  title: string;
  department: string;
  college: string;
  batch: string;
  event_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  is_registration_open: boolean;
}

export interface EligibilityResponse {
  status: "ELIGIBLE" | "INVALID_USN" | "ALREADY_REGISTERED" | "REGISTRATION_CLOSED" | "INACTIVE";
  message: string;
  student_name?: string;
  masked_email?: string;
  usn?: string;
  department?: string;
  has_existing_coupon: boolean;
  coupon_id?: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  masked_email: string;
  expires_in_seconds: number;
  dev_otp?: string;
}

export interface VerifyIdentityResponse {
  success: boolean;
  message: string;
  access_token: string;
  token_type: string;
  student_id: string;
  usn: string;
  student_name: string;
  email: string;
  department: string;
  has_coupon: boolean;
}

export interface FoodCouponData {
  coupon_id: string;
  coupon_code: string;
  qr_token?: string;
  status: "ACTIVE" | "REDEEMED" | "REVOKED";
  student_name: string;
  usn: string;
  department: string;
  batch: string;
  created_at: string;
  redeemed_at?: string;
  volunteer_name?: string;
}

export interface ClaimTicketResponse {
  success: boolean;
  message: string;
  access_token: string;
  token_type: string;
  coupon_id: string;
  coupon_code: string;
  qr_token: string;
  status: "ACTIVE" | "REDEEMED" | "REVOKED";
  student_name: string;
  usn: string;
  department: string;
  batch: string;
  created_at: string;
  redeemed_at?: string;
  volunteer_name?: string;
}

