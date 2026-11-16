import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  AlertTriangle,
  RefreshCw,
  Ban
} from 'lucide-react';
import { api } from '../services/api';
import type { FoodCouponItem } from '../types';

export const CouponListPage: React.FC = () => {
  const [coupons, setCoupons] = useState<FoodCouponItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Revocation modal state
  const [selectedCoupon, setSelectedCoupon] = useState<FoodCouponItem | null>(null);
  const [revokeReason, setRevokeReason] = useState('Duplicate registration detected');

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await api.getCoupons(search, statusFilter, page, 50);
      setCoupons(res.coupons);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadCoupons();
  };

  const handleRevokeSubmit = async () => {
    if (!selectedCoupon) return;
    try {
      await api.revokeCoupon(selectedCoupon.id, revokeReason);
      setSelectedCoupon(null);
      loadCoupons();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke coupon');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[#FFD78A] text-lg font-serif">✦</span>
          <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#D9AC63]">
            Voucher Control
          </span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F2E8]">
          Food Coupon Registry ({total})
        </h1>
        <p className="text-xs text-[#B9ADA0] mt-1">
          Audit every digital food coupon issued for AAGAZZ 2K26.
        </p>
      </div>

      {/* Filters */}
      <div className="glass-luxury rounded-2xl p-4 border border-[#D9AC63]/25 flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 text-[#D9AC63] top-3" />
          <input
            type="text"
            placeholder="Search by Coupon Code, USN, or Student Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#080604] border border-[#D9AC63]/30 text-xs text-[#F8F2E8] placeholder:text-[#B9ADA0]/50 focus:outline-none focus:border-[#FFD78A]"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-[#D9AC63]" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 rounded-xl bg-[#080604] border border-[#D9AC63]/30 text-xs text-[#FFD78A] font-semibold focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Passes</option>
            <option value="REDEEMED">Redeemed</option>
            <option value="REVOKED">Revoked Passes</option>
          </select>

          <button
            onClick={loadCoupons}
            className="p-2.5 rounded-xl bg-[#15100C] border border-[#D9AC63]/30 text-[#FFD78A] hover:bg-[#221F1B]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="glass-luxury rounded-2xl border border-[#D9AC63]/25 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#15100C] text-[#FFD78A] border-b border-[#D9AC63]/20">
              <tr>
                <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider">Coupon ID</th>
                <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider">Student Name</th>
                <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider">USN</th>
                <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider">Status</th>
                <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider">Redemption Time</th>
                <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider">Verified By</th>
                <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#221F1B]">
              {loading && coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#B9ADA0]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#D9AC63]" />
                    <span>Loading coupon ledger...</span>
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#B9ADA0]">
                    No food coupons found.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-[#15100C]/60 text-[#F8F2E8]">
                    <td className="p-3.5 font-mono font-bold text-[#FFD78A]">{coupon.coupon_code}</td>
                    <td className="p-3.5 font-semibold">{coupon.student_name}</td>
                    <td className="p-3.5 font-mono text-[#D9AC63]">{coupon.usn}</td>
                    <td className="p-3.5">
                      {coupon.status === 'ACTIVE' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                          ACTIVE
                        </span>
                      )}
                      {coupon.status === 'REDEEMED' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-400 font-bold text-[10px] border border-amber-500/30">
                          REDEEMED
                        </span>
                      )}
                      {coupon.status === 'REVOKED' && (
                        <span className="px-2 py-0.5 rounded-full bg-red-950/60 text-red-400 font-bold text-[10px] border border-red-500/30">
                          REVOKED
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-[#B9ADA0]">
                      {coupon.redeemed_at
                        ? new Date(coupon.redeemed_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: 'numeric',
                            month: 'short',
                          })
                        : '—'}
                    </td>
                    <td className="p-3.5 text-[#B9ADA0]">
                      {coupon.volunteer_name || '—'}
                    </td>
                    <td className="p-3.5 text-right">
                      {coupon.status === 'ACTIVE' && (
                        <button
                          onClick={() => setSelectedCoupon(coupon)}
                          className="px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/40 text-red-300 text-[11px] font-bold border border-red-800/40 flex items-center gap-1 ml-auto"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Revoke</span>
                        </button>
                      )}
                      {coupon.status === 'REVOKED' && (
                        <span className="text-[10px] text-red-400 italic" title={coupon.revocation_reason || ''}>
                          {coupon.revocation_reason?.slice(0, 20) || 'Revoked'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revocation Modal */}
      {selectedCoupon && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-luxury max-w-md w-full p-6 rounded-2xl border border-red-800/50 shadow-2xl">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-serif text-lg font-bold">Revoke Food Coupon</h3>
            </div>

            <p className="text-xs text-[#B9ADA0] mb-4">
              Revoking coupon <strong className="text-[#FFD78A]">{selectedCoupon.coupon_code}</strong> will permanently invalidate it for student <strong>{selectedCoupon.student_name}</strong> ({selectedCoupon.usn}).
            </p>

            <div className="mb-4">
              <label className="block text-[11px] uppercase tracking-wider text-[#FFD78A] font-bold mb-1">
                Reason for Revocation
              </label>
              <textarea
                rows={3}
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#080604] border border-[#D9AC63]/30 text-xs text-[#F8F2E8] focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedCoupon(null)}
                className="px-4 py-2 rounded-xl bg-[#221F1B] text-xs font-semibold text-[#B9ADA0]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokeSubmit}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                Confirm Revocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
