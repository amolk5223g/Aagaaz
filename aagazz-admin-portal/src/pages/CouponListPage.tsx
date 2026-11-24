import React, { useState, useEffect } from 'react';
import { Pager, Sheet } from '../components/Ledger';
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

  const stamp = (s: FoodCouponItem['status']) =>
    s === 'ACTIVE' ? <span className="stamp stamp--blue">Ready</span>
      : s === 'REDEEMED' ? <span className="stamp stamp--green">Redeemed</span>
        : <span className="stamp stamp--red">Revoked</span>;

  return (
    <>
      <header className="head">
        <h1>Coupons <small>{total}</small></h1>
      </header>

      <div className="tools">
        <form onSubmit={handleSearchSubmit} role="search">
          <input type="search" aria-label="Search coupons" placeholder="Coupon code, USN or name" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn">Search</button>
        </form>
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Ready to use</option>
          <option value="REDEEMED">Redeemed</option>
          <option value="REVOKED">Revoked</option>
        </select>
        <button onClick={loadCoupons} className="btn" disabled={loading}>{loading ? 'Refreshing' : 'Refresh'}</button>
      </div>

      <div className="scroll">
        <table className="ledger">
          <thead>
            <tr><th>Coupon code</th><th>Student</th><th>USN</th><th>Status</th><th>Redeemed at</th><th>Scanned by</th><th className="num">Action</th></tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr><td colSpan={7} className="none">{loading ? 'Loading coupons' : 'No coupons match. Clear the search or pick another status.'}</td></tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="code">{coupon.coupon_code}</td>
                  <td>{coupon.student_name}</td>
                  <td className="code">{coupon.usn}</td>
                  <td>{stamp(coupon.status)}</td>
                  <td>
                    {coupon.redeemed_at
                      ? new Date(coupon.redeemed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
                      : ''}
                  </td>
                  <td>{coupon.volunteer_name || ''}</td>
                  <td className="num">
                    {coupon.status === 'ACTIVE' && <button onClick={() => setSelectedCoupon(coupon)} className="link bad">Revoke</button>}
                    {coupon.status === 'REVOKED' && <span title={coupon.revocation_reason || ''}>{coupon.revocation_reason?.slice(0, 20) || 'Revoked'}</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pager page={page} total={total} setPage={setPage} />

      {selectedCoupon && (
        <Sheet title="Revoke coupon" onClose={() => setSelectedCoupon(null)}>
          <p>
            {selectedCoupon.coupon_code} stops working for {selectedCoupon.student_name} ({selectedCoupon.usn}). This can't be undone.
          </p>
          <div className="field">
            <label htmlFor="reason">Reason</label>
            <textarea id="reason" rows={3} value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)} />
          </div>
          <div className="row">
            <button type="button" onClick={() => setSelectedCoupon(null)} className="btn">Keep it</button>
            <button type="button" onClick={handleRevokeSubmit} className="btn btn--red">Revoke coupon</button>
          </div>
        </Sheet>
      )}
    </>
  );
};
