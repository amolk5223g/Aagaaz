import type {
  AuthUser,
  AnalyticsData,
  EligibleStudentItem,
  FoodCouponItem,
  VolunteerItem,
  ImportSummary,
  ScannerRedemptionResult
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname || 'localhost'}:8000/api/v1`;

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('aagazz_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Authentication
  async login(email: string, password: string): Promise<AuthUser> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Login failed. Check your credentials.');
    }

    const data = await res.json();
    const user: AuthUser = {
      token: data.access_token,
      role: data.role,
      email: data.email,
      fullName: data.full_name,
    };

    localStorage.setItem('aagazz_admin_token', user.token);
    localStorage.setItem('aagazz_admin_role', user.role);
    localStorage.setItem('aagazz_admin_name', user.fullName);
    localStorage.setItem('aagazz_admin_email', user.email);
    return user;
  },

  logout() {
    localStorage.removeItem('aagazz_admin_token');
    localStorage.removeItem('aagazz_admin_role');
    localStorage.removeItem('aagazz_admin_name');
    localStorage.removeItem('aagazz_admin_email');
  },

  getCurrentUser(): AuthUser | null {
    const token = localStorage.getItem('aagazz_admin_token');
    const role = localStorage.getItem('aagazz_admin_role') as any;
    const fullName = localStorage.getItem('aagazz_admin_name') || '';
    const email = localStorage.getItem('aagazz_admin_email') || '';

    if (!token || !role) return null;
    return { token, role, fullName, email };
  },

  // Admin Dashboard
  async getAnalytics(): Promise<AnalyticsData> {
    const res = await fetch(`${API_BASE_URL}/admin/analytics`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load dashboard metrics');
    return res.json();
  },

  async toggleRegistration(is_registration_open: boolean): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/admin/registration-control`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ is_registration_open }),
    });
    if (!res.ok) throw new Error('Failed to toggle registration state');
    const data = await res.json();
    return data.is_registration_open;
  },

  // Students Whitelist Import & List
  async importStudents(file: File): Promise<ImportSummary> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/admin/students/import`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Import failed.');
    }
    return res.json();
  },

  async getEligibleStudents(
    search?: string,
    statusFilter?: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ total: number; page: number; students: EligibleStudentItem[] }> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.append('search', search);
    if (statusFilter && statusFilter !== 'ALL') params.append('status_filter', statusFilter);

    const res = await fetch(`${API_BASE_URL}/admin/students?${params.toString()}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load students');
    return res.json();
  },

  async toggleStudentStatus(id: string, is_active: boolean) {
    const res = await fetch(`${API_BASE_URL}/admin/students/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ is_active }),
    });
    if (!res.ok) throw new Error('Failed to update student status');
    return res.json();
  },

  // Coupons
  async getCoupons(
    search?: string,
    statusFilter?: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ total: number; page: number; coupons: FoodCouponItem[] }> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.append('search', search);
    if (statusFilter && statusFilter !== 'ALL') params.append('status_filter', statusFilter);

    const res = await fetch(`${API_BASE_URL}/admin/coupons?${params.toString()}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load coupons');
    return res.json();
  },

  async revokeCoupon(id: string, reason: string) {
    const res = await fetch(`${API_BASE_URL}/admin/coupons/${id}/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to revoke coupon');
    return res.json();
  },

  // Volunteers
  async getVolunteers(): Promise<VolunteerItem[]> {
    const res = await fetch(`${API_BASE_URL}/admin/volunteers`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load volunteers');
    return res.json();
  },

  async createVolunteer(payload: { email: string; full_name: string; password: string }): Promise<VolunteerItem> {
    const res = await fetch(`${API_BASE_URL}/admin/volunteers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create volunteer');
    }
    return res.json();
  },

  async toggleVolunteerStatus(id: string, is_active: boolean) {
    const res = await fetch(`${API_BASE_URL}/admin/volunteers/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ is_active }),
    });
    if (!res.ok) throw new Error('Failed to update volunteer status');
    return res.json();
  },

  // Volunteer QR Scanner Endpoints
  async redeemCoupon(codeOrToken: string, counterName: string = 'Counter C102'): Promise<ScannerRedemptionResult> {
    const res = await fetch(`${API_BASE_URL}/volunteer/coupons/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        qr_token: codeOrToken,
        coupon_code: codeOrToken,
        counter_name: counterName,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Redemption request failed');
    }
    return res.json();
  },

  async getVolunteerStats(): Promise<{ volunteer_name: string; role: string; total_scanned: number }> {
    const res = await fetch(`${API_BASE_URL}/volunteer/stats`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to get volunteer stats');
    return res.json();
  },

  async getVolunteerRedemptions(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/volunteer/redemptions`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to get scan history');
    return res.json();
  }
};

