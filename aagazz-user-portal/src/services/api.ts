import type {
  EventData,
  EligibilityResponse,
  SendOtpResponse,
  VerifyIdentityResponse,
  FoodCouponData,
  ClaimTicketResponse
} from '../types';

function resolveApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    const cleanUrl = envUrl.replace(/\/+$/, '');
    return cleanUrl.endsWith('/api/v1') ? cleanUrl : `${cleanUrl}/api/v1`;
  }

  if (typeof window !== 'undefined') {
    // When served over HTTPS (e.g. on Vercel), insecure HTTP triggers Mixed Content blocking.
    if (window.location.protocol === 'https:') {
      return 'https://aagaaz-z7hb.onrender.com/api/v1';
    }
    return `http://${window.location.hostname || 'localhost'}:8000/api/v1`;
  }
  return 'http://localhost:8000/api/v1';
}

const API_BASE_URL = resolveApiBaseUrl();

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('aagazz_student_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...getAuthHeader(),
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('aagazz_student_token');
    localStorage.removeItem('aagazz_student_usn');
    localStorage.removeItem('aagazz_student_name');
  }
  return res;
}

export const api = {
  // Public
  async getActiveEvent(): Promise<EventData> {
    const res = await fetch(`${API_BASE_URL}/events/active`);
    if (!res.ok) throw new Error('Failed to fetch event data');
    return res.json();
  },

  // Auth & Whitelist
  async checkEligibility(usn: string): Promise<EligibilityResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usn }),
    });
    return res.json();
  },

  async sendOtp(usn: string, email: string): Promise<SendOtpResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usn, email }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to dispatch passcode');
    }
    return res.json();
  },

  async verifyIdentity(usn: string, email: string, otp: string): Promise<VerifyIdentityResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/verify-identity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usn, email, otp }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Passcode verification failed');
    }
    const data: VerifyIdentityResponse = await res.json();
    if (data.access_token) {
      localStorage.setItem('aagazz_student_token', data.access_token);
      localStorage.setItem('aagazz_student_usn', data.usn);
      localStorage.setItem('aagazz_student_name', data.student_name);
    }
    return data;
  },

  // Direct Ticket Access with Common Passcode
  async claimTicket(usn: string, accessCode: string): Promise<ClaimTicketResponse> {
    const res = await fetch(`${API_BASE_URL}/students/claim-ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usn, access_code: accessCode }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to claim VIP ticket');
    }
    const data: ClaimTicketResponse = await res.json();
    if (data.access_token) {
      localStorage.setItem('aagazz_student_token', data.access_token);
      localStorage.setItem('aagazz_student_usn', data.usn);
      localStorage.setItem('aagazz_student_name', data.student_name);
    }
    return data;
  },

  // Student Coupon
  async registerAndClaimCoupon(): Promise<FoodCouponData> {
    const res = await authFetch(`${API_BASE_URL}/students/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to claim coupon');
    }
    return res.json();
  },

  async getMyCoupon(): Promise<FoodCouponData> {
    const res = await authFetch(`${API_BASE_URL}/students/me/coupon`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to retrieve coupon');
    }
    return res.json();
  },

  async getCouponStatus(): Promise<{ has_coupon: boolean; status?: string; redeemed_at?: string; volunteer_name?: string }> {
    const res = await authFetch(`${API_BASE_URL}/students/me/status`);
    if (!res.ok) throw new Error('Failed to get coupon status');
    return res.json();
  },

  logout() {
    localStorage.removeItem('aagazz_student_token');
    localStorage.removeItem('aagazz_student_usn');
    localStorage.removeItem('aagazz_student_name');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('aagazz_student_token');
  }
};
