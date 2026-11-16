import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket,
  ToggleLeft,
  ToggleRight,
  UploadCloud,
  QrCode,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import type { AnalyticsData } from '../types';

export const DashboardPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getAnalytics();
      setAnalytics(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // 10s live refresh
    return () => clearInterval(interval);
  }, []);

  const handleToggleRegistration = async () => {
    if (!analytics) return;
    setToggleLoading(true);
    try {
      const newState = !analytics.registration_open;
      const updated = await api.toggleRegistration(newState);
      setAnalytics({ ...analytics, registration_open: updated });
    } catch (err: any) {
      alert(err.message || 'Failed to change registration state');
    } finally {
      setToggleLoading(false);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[#FFD78A]">
        <RefreshCw className="w-8 h-8 animate-spin mb-3" />
        <span className="text-sm font-serif">Loading live event metrics...</span>
      </div>
    );
  }

  const redemptionRate = analytics?.total_coupons_generated
    ? Math.round((analytics.redeemed_coupons / analytics.total_coupons_generated) * 100)
    : 0;

  const registrationRate = analytics?.total_eligible_students
    ? Math.round((analytics.total_registered_students / analytics.total_eligible_students) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner with Registration Switch */}
      <div className="glass-luxury rounded-2xl p-6 border border-[#D9AC63]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#FFD78A] text-lg font-serif">✦</span>
            <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#D9AC63]">
              Operations Control
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F2E8]">
            AAGAZZ 2K26 Overview
          </h1>
          <p className="text-xs text-[#B9ADA0] mt-1">
            Department of AI & DS • Batch 2025–29 • Venue: C102
          </p>
        </div>

        {/* Registration Toggle Switch */}
        <div className="flex items-center gap-3 bg-[#080604] p-3 rounded-xl border border-[#D9AC63]/30">
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase font-bold text-[#B9ADA0]">Registration State</span>
            <span
              className={`text-xs font-bold ${
                analytics?.registration_open ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {analytics?.registration_open ? 'OPEN FOR STUDENTS' : 'REGISTRATION CLOSED'}
            </span>
          </div>

          <button
            onClick={handleToggleRegistration}
            disabled={toggleLoading}
            className={`p-1 rounded-lg transition-transform active:scale-95 ${
              analytics?.registration_open ? 'text-emerald-400' : 'text-red-400'
            }`}
            title="Toggle Registration"
          >
            {analytics?.registration_open ? (
              <ToggleRight className="w-9 h-9" />
            ) : (
              <ToggleLeft className="w-9 h-9" />
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 6 Key Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#15100C] border border-[#D9AC63]/25 rounded-xl p-4 shadow-md flex flex-col justify-between">
          <span className="text-[10px] uppercase text-[#B9ADA0] font-bold">Total Whitelisted</span>
          <span className="font-serif text-2xl font-bold text-[#F8F2E8] my-1">
            {analytics?.total_eligible_students}
          </span>
          <span className="text-[10px] text-[#D9AC63]">AI & DS Students</span>
        </div>

        <div className="bg-[#15100C] border border-[#D9AC63]/25 rounded-xl p-4 shadow-md flex flex-col justify-between">
          <span className="text-[10px] uppercase text-[#B9ADA0] font-bold">Registered</span>
          <span className="font-serif text-2xl font-bold text-[#FFD78A] my-1">
            {analytics?.total_registered_students}
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold">{registrationRate}% Verified</span>
        </div>

        <div className="bg-[#15100C] border border-[#D9AC63]/25 rounded-xl p-4 shadow-md flex flex-col justify-between">
          <span className="text-[10px] uppercase text-[#B9ADA0] font-bold">Coupons Issued</span>
          <span className="font-serif text-2xl font-bold text-[#F8F2E8] my-1">
            {analytics?.total_coupons_generated}
          </span>
          <span className="text-[10px] text-[#D9AC63]">Digital QR Tokens</span>
        </div>

        <div className="bg-[#15100C] border border-[#D9AC63]/25 rounded-xl p-4 shadow-md flex flex-col justify-between">
          <span className="text-[10px] uppercase text-[#B9ADA0] font-bold">Active Passes</span>
          <span className="font-serif text-2xl font-bold text-[#D9AC63] my-1">
            {analytics?.active_coupons}
          </span>
          <span className="text-[10px] text-[#B9ADA0]">Awaiting Scan</span>
        </div>

        <div className="bg-[#15100C] border border-emerald-500/30 rounded-xl p-4 shadow-md flex flex-col justify-between bg-gradient-to-b from-[#15100C] to-emerald-950/20">
          <span className="text-[10px] uppercase text-emerald-400 font-bold">Redeemed</span>
          <span className="font-serif text-2xl font-bold text-emerald-400 my-1">
            {analytics?.redeemed_coupons}
          </span>
          <span className="text-[10px] text-emerald-300 font-semibold">{redemptionRate}% Claimed</span>
        </div>

        <div className="bg-[#15100C] border border-[#D9AC63]/25 rounded-xl p-4 shadow-md flex flex-col justify-between">
          <span className="text-[10px] uppercase text-[#B9ADA0] font-bold">Remaining</span>
          <span className="font-serif text-2xl font-bold text-[#FFD78A] my-1">
            {analytics?.remaining_coupons}
          </span>
          <span className="text-[10px] text-[#D9AC63] font-semibold">Unredeemed</span>
        </div>
      </div>

      {/* Visual Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Registration Progress */}
        <div className="glass-luxury rounded-2xl p-5 border border-[#D9AC63]/25">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold text-[#FFD78A] tracking-wider">
              Student Registration Progress
            </span>
            <span className="font-mono text-xs font-bold text-[#FFD78A]">
              {analytics?.total_registered_students} / {analytics?.total_eligible_students}
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-[#080604] border border-[#D9AC63]/20 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FFD78A] to-[#D9AC63] rounded-full transition-all duration-500"
              style={{ width: `${registrationRate}%` }}
            />
          </div>
          <p className="text-[11px] text-[#B9ADA0] mt-2">
            {registrationRate}% of approved department students have verified their college USN.
          </p>
        </div>

        {/* Food Banquet Redemption Progress */}
        <div className="glass-luxury rounded-2xl p-5 border border-[#D9AC63]/25">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
              Food Coupon Redemption Progress
            </span>
            <span className="font-mono text-xs font-bold text-emerald-400">
              {analytics?.redeemed_coupons} / {analytics?.total_coupons_generated}
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-[#080604] border border-emerald-500/20 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all duration-500"
              style={{ width: `${redemptionRate}%` }}
            />
          </div>
          <p className="text-[11px] text-[#B9ADA0] mt-2">
            {analytics?.remaining_coupons} meals remaining to be claimed at Counter C102.
          </p>
        </div>
      </div>

      {/* Action Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/import"
          className="p-4 rounded-xl bg-[#15100C] hover:bg-[#221F1B] border border-[#D9AC63]/30 flex items-center gap-3.5 transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-[#080604] text-[#FFD78A] flex items-center justify-center border border-[#D9AC63]/30 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-sm font-bold text-[#F8F2E8]">Import Student Whitelist</h3>
            <p className="text-[11px] text-[#B9ADA0]">Upload CSV / Excel list (400+ students)</p>
          </div>
        </Link>

        <Link
          to="/coupons"
          className="p-4 rounded-xl bg-[#15100C] hover:bg-[#221F1B] border border-[#D9AC63]/30 flex items-center gap-3.5 transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-[#080604] text-[#FFD78A] flex items-center justify-center border border-[#D9AC63]/30 group-hover:scale-105 transition-transform">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-sm font-bold text-[#F8F2E8]">Manage Coupons</h3>
            <p className="text-[11px] text-[#B9ADA0]">Inspect status or revoke passes</p>
          </div>
        </Link>

        <Link
          to="/scanner"
          className="p-4 rounded-xl bg-[#15100C] hover:bg-[#221F1B] border border-emerald-500/30 flex items-center gap-3.5 transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-[#080604] text-emerald-400 flex items-center justify-center border border-emerald-500/30 group-hover:scale-105 transition-transform">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-sm font-bold text-emerald-400">Launch QR Scanner</h3>
            <p className="text-[11px] text-[#B9ADA0]">Redeem student food passes</p>
          </div>
        </Link>
      </div>
    </div>
  );
};
