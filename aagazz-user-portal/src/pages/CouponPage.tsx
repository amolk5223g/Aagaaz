import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Sparkles,
  Download,
  Share2,
  RefreshCw,
  Utensils,
  CheckCircle2,
  XCircle,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import type { FoodCouponData } from '../types';

export const CouponPage: React.FC = () => {
  const [coupon, setCoupon] = useState<FoodCouponData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchCoupon = async () => {
    if (!api.isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMyCoupon();
      setCoupon(data);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to retrieve your coupon.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupon();

    // Auto-poll every 6 seconds to reflect volunteer scan redemption in real time!
    const pollInterval = setInterval(() => {
      if (api.isAuthenticated()) {
        api.getCouponStatus().then((statusRes) => {
          if (statusRes.has_coupon && statusRes.status) {
            setCoupon((prev) => {
              if (prev && prev.status !== statusRes.status) {
                return {
                  ...prev,
                  status: statusRes.status as any,
                  redeemed_at: statusRes.redeemed_at,
                  volunteer_name: statusRes.volunteer_name,
                };
              }
              return prev;
            });
          }
        }).catch(() => {});
      }
    }, 6000);

    return () => clearInterval(pollInterval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleShare = async () => {
    if (navigator.share && coupon) {
      try {
        await navigator.share({
          title: 'AAGAZZ 2K26 Food Coupon',
          text: `AAGAZZ 2K26 Official Food Coupon for ${coupon.student_name} (${coupon.usn})`,
          url: window.location.href,
        });
      } catch (e) {
        // user dismissed
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Pass link copied to clipboard!');
    }
  };

  const handleDownload = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080604] pt-28 pb-16 flex flex-col items-center justify-center text-center px-4">
        <RefreshCw className="w-8 h-8 text-[#FFD78A] animate-spin mb-3" />
        <p className="text-sm font-serif text-[#FFD78A]">Retrieving your VIP Pass...</p>
      </div>
    );
  }

  // Not authenticated / No coupon yet
  if (!api.isAuthenticated() || !coupon) {
    return (
      <div className="min-h-screen bg-[#080604] pt-28 pb-16 flex flex-col items-center justify-center text-center px-4">
        <div className="glass-luxury max-w-md w-full p-8 rounded-2xl border border-[#D9AC63]/30 text-center">
          <div className="w-14 h-14 rounded-full bg-[#15100C] border border-[#D9AC63]/40 flex items-center justify-center text-[#FFD78A] mx-auto mb-4 shadow-gold">
            <Utensils className="w-7 h-7" />
          </div>

          <h2 className="font-serif text-2xl font-bold text-[#F8F2E8] mb-2">
            No Active Pass Found
          </h2>

          <p className="text-xs text-[#B9ADA0] mb-6 leading-relaxed">
            {errorMessage || "Please enter your college USN and verify the one-time passcode to claim or access your official AAGAZZ 2K26 Food Coupon."}
          </p>

          <Link
            to="/register"
            className="btn-gold-3d w-full h-12 rounded-xl uppercase tracking-wider text-xs flex items-center justify-center gap-2"
          >
            <span>VERIFY USN & CLAIM PASS</span>
          </Link>
        </div>
      </div>
    );
  }

  const isRedeemed = coupon.status === 'REDEEMED';
  const isRevoked = coupon.status === 'REVOKED';
  const isActive = coupon.status === 'ACTIVE';

  return (
    <div className="min-h-screen bg-[#080604] pt-24 pb-20 px-4 flex flex-col items-center justify-center relative print:p-0 print:bg-white print:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 z-50 px-4 py-2.5 rounded-full bg-[#221F1B] border border-[#D9AC63] text-[#FFD78A] text-xs font-semibold shadow-gold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Ambient background glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#D9AC63]/10 rounded-full blur-[100px] pointer-events-none print:hidden" />

      <div className="w-full max-w-sm relative z-10 flex flex-col items-center perspective-container">
        {/* Pass Top Indicator Bar */}
        <div className="w-full flex items-center justify-between mb-3 px-1 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#FFD78A]">
              OFFICIAL VIP FOOD PASS
            </span>
          </div>

          <button
            onClick={fetchCoupon}
            className="flex items-center gap-1.5 text-[11px] text-[#B9ADA0] hover:text-[#FFD78A] transition-colors py-1 px-2.5 rounded-lg bg-[#15100C] border border-[#D9AC63]/25"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* 3D Skeuomorphic Golden Coupon Ticket */}
        <div className="w-full rounded-2xl bg-gradient-to-b from-[#18130F] to-[#110D0A] border border-[#D9AC63]/50 ticket-3d overflow-hidden relative">
          {/* Holographic Shimmer Highlight */}
          <div className="absolute inset-0 shimmer-gold pointer-events-none opacity-40" />

          {/* Top Gold Foil Accent Bar */}
          <div className="h-2 w-full bg-gradient-to-r from-[#B88643] via-[#FFF0CF] via-[#FFD78A] to-[#B88643] shadow-md" />

          {/* Ticket Header */}
          <div className="p-5 pb-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[#FFD78A]">
                  <span className="text-sm font-serif">✦</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#FFD78A]">
                    Department of AI & DS
                  </span>
                </div>
                <h1 className="font-serif text-2xl font-bold text-[#FFD78A] mt-0.5 tracking-wide">
                  AAGAZZ 2K26
                </h1>
              </div>

              {/* Dynamic Status Pill */}
              <div>
                {isActive && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold uppercase tracking-wider shadow-inner">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>ACTIVE</span>
                  </div>
                )}
                {isRedeemed && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>REDEEMED</span>
                  </div>
                )}
                {isRevoked && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                    <XCircle className="w-3 h-3" />
                    <span>REVOKED</span>
                  </div>
                )}
              </div>
            </div>

            {/* Voucher Subheading */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#D9AC63]/20">
              <span className="text-[10px] uppercase font-bold text-[#080604] bg-[#FFD78A] px-2.5 py-0.5 rounded-full">
                OFFICIAL FOOD COUPON
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#FFD78A] font-semibold">
                ONE-TIME FOOD REDEMPTION
              </span>
            </div>
          </div>

          {/* Ticket Perforation Notches */}
          <div className="relative w-full h-6 flex items-center justify-between">
            <div className="ticket-notch-left -ml-0.5 shadow-inner" />
            <div className="flex-1 border-t border-dashed border-[#D9AC63]/40 mx-2" />
            <div className="ticket-notch-right -mr-0.5 shadow-inner" />
          </div>

          {/* Ticket Body: Student Details */}
          <div className="p-5 pt-2 flex flex-col items-center">
            {/* Student Metadata Box */}
            <div className="w-full bg-[#080604]/90 border border-[#D9AC63]/25 rounded-xl p-3.5 mb-4 grid grid-cols-2 gap-2 text-left">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-[#B9ADA0] font-semibold block">
                  Student Name
                </span>
                <span className="font-serif text-sm font-bold text-[#F8F2E8] truncate block">
                  {coupon.student_name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider text-[#B9ADA0] font-semibold block">
                  USN
                </span>
                <span className="font-mono text-sm font-bold text-[#FFD78A] block">
                  {coupon.usn}
                </span>
              </div>

              <div className="col-span-2 pt-2 mt-1 border-t border-[#221F1B] flex items-center justify-between text-[10px]">
                <span className="text-[#B9ADA0]">Coupon Code:</span>
                <span className="font-mono font-bold text-[#FFD78A]">{coupon.coupon_code}</span>
              </div>
            </div>

            {/* High-Resolution QR Code Container */}
            <div className="relative p-3 rounded-2xl bg-[#221F1B] border border-[#D9AC63]/30 shadow-inner flex flex-col items-center">
              <div className="p-3 bg-white rounded-xl shadow-lg relative flex items-center justify-center">
                <QRCodeSVG
                  value={coupon.qr_token || coupon.coupon_code}
                  size={180}
                  level="H"
                  includeMargin={false}
                  fgColor="#080604"
                />

                {/* Status Overlays */}
                {isRedeemed && (
                  <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-2 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-1" />
                    <span className="font-serif text-lg font-bold text-emerald-400">REDEEMED</span>
                    <span className="text-[10px] text-[#B9ADA0] mt-0.5">Scanned at Banquet Counter</span>
                    {coupon.redeemed_at && (
                      <span className="text-[9px] font-mono text-[#D9AC63] mt-1">
                        {new Date(coupon.redeemed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                )}

                {isRevoked && (
                  <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-2 text-center">
                    <XCircle className="w-10 h-10 text-red-400 mb-1" />
                    <span className="font-serif text-lg font-bold text-red-400">REVOKED</span>
                    <span className="text-[10px] text-red-300 mt-0.5">Pass Inactive</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-[#FFD78A] uppercase font-mono tracking-wider font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>CRYPTOGRAPHICALLY SECURE TOKEN</span>
              </div>
            </div>

            {/* Banquet Menu Pill */}
            <div className="w-full mt-4 p-3 rounded-xl bg-[#080604]/80 border border-[#D9AC63]/20 flex items-center justify-between text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#221F1B] flex items-center justify-center text-[#FFD78A]">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#F8F2E8]">Freshers Gala Buffet</p>
                  <p className="text-[10px] text-[#B9ADA0]">Starters, Main Course & Dessert</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#080604] bg-[#D9AC63] px-2 py-0.5 rounded">
                1 MEAL
              </span>
            </div>

            {/* Guidance Terms */}
            <div className="mt-3 text-[10px] text-[#B9ADA0] leading-snug text-center">
              Present this QR code to the authorized volunteer at Counter C102.
              Single use only. Invalidated immediately upon redemption.
            </div>
          </div>

          {/* Ticket Footnote */}
          <div className="bg-[#080604] px-5 py-2.5 border-t border-[#D9AC63]/20 flex items-center justify-between text-[10px] text-[#B9ADA0]">
            <span>26 Feb 2026 • Thursday</span>
            <span className="text-[#FFD78A] font-semibold">AI & DS DEPT, SGBIT</span>
          </div>
        </div>

        {/* Redeemed Warning Banner */}
        {isRedeemed && (
          <div className="w-full mt-3.5 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs text-center font-semibold">
            ✦ MEAL PASS ALREADY REDEEMED ✦<br />
            <span className="text-[11px] text-amber-200/80 font-normal">
              One USN = One Coupon Policy Enforced. This pass has been used and no further coupons can be issued for USN {coupon.usn}.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5 mt-4 print:hidden">
          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              onClick={handleDownload}
              className="py-3 px-4 rounded-xl bg-[#15100C] border border-[#D9AC63]/40 text-[#FFD78A] text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-[#221F1B]"
            >
              <Download className="w-4 h-4" />
              <span>Download Pass</span>
            </button>

            <button
              onClick={handleShare}
              className="py-3 px-4 rounded-xl bg-[#15100C] border border-[#D9AC63]/40 text-[#FFD78A] text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-[#221F1B]"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Pass</span>
            </button>
          </div>

          <Link
            to="/"
            className="w-full py-2.5 text-center text-xs text-[#B9ADA0] hover:text-[#FFD78A] transition-colors"
          >
            ← Back to Gala Invitation
          </Link>
        </div>
      </div>
    </div>
  );
};
