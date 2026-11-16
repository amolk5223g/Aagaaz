import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Fingerprint,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Ticket
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  // Form inputs
  const [usn, setUsn] = useState('');
  const [accessCode, setAccessCode] = useState('AAGAZZ2026');

  // Feedback & Loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleClaimTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanUsn = usn.trim().toUpperCase();
    const cleanCode = accessCode.trim().toUpperCase();

    if (!cleanUsn) {
      setError('Please enter your official College USN.');
      return;
    }

    if (!cleanCode) {
      setError('Please enter the event access code.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.claimTicket(cleanUsn, cleanCode);
      setSuccessMsg(res.message);

      // Trigger celebratory golden confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD78A', '#D9AC63', '#B88643', '#FFFFFF']
      });

      // Quick smooth transition to the VIP ticket view
      setTimeout(() => {
        navigate('/coupon');
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Failed to claim ticket. Please check your USN and access code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background radial gold glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D9AC63]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Card Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#15100C] border border-[#D9AC63]/40 text-[#FFD78A] text-[11px] font-bold uppercase tracking-widest mb-3 shadow-gold">
            <Sparkles className="w-3.5 h-3.5 text-[#D9AC63]" />
            <span>AI &amp; DS Freshers Gala Pass</span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F2E8] tracking-wide">
            CLAIM YOUR FOOD TICKET
          </h1>
          <p className="text-xs text-[#B9ADA0] mt-1.5 max-w-xs mx-auto">
            Enter your approved College USN and Event Passcode to access your digital QR coupon.
          </p>
        </div>

        {/* Main Form Card */}
        <div className="glass-luxury rounded-3xl p-6 sm:p-8 border border-[#D9AC63]/30 shadow-[0_12px_40px_rgba(0,0,0,0.85)] relative overflow-hidden">
          {/* Top Gold Accent Line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#FFD78A] to-transparent" />

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 flex items-start gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2.5 text-xs text-emerald-300">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleClaimTicket} className="space-y-5">
            {/* USN Input */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#FFD78A] font-bold mb-1.5">
                College USN <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Fingerprint className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D9AC63]" />
                <input
                  type="text"
                  placeholder="e.g. 4SG25AD001"
                  value={usn}
                  onChange={(e) => setUsn(e.target.value.toUpperCase())}
                  required
                  autoFocus
                  className="w-full h-12 pl-11 pr-4 rounded-xl bg-[#080604] border border-[#D9AC63]/35 text-[#F8F2E8] text-sm font-mono tracking-wider placeholder:text-[#B9ADA0]/40 focus:outline-none focus:border-[#FFD78A] focus:ring-1 focus:ring-[#FFD78A] transition-all"
                />
              </div>
              <span className="text-[10px] text-[#B9ADA0] mt-1 block">
                Must be an active student in the Department of AI &amp; DS.
              </span>
            </div>

            {/* Event Access Code Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] uppercase tracking-wider text-[#FFD78A] font-bold">
                  Event Passcode <span className="text-red-400">*</span>
                </label>
                <span className="text-[10px] text-[#D9AC63] font-mono">
                  Default: AAGAZZ2026
                </span>
              </div>
              <div className="relative">
                <KeyRound className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D9AC63]" />
                <input
                  type="text"
                  placeholder="AAGAZZ2026"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  required
                  className="w-full h-12 pl-11 pr-4 rounded-xl bg-[#080604] border border-[#D9AC63]/35 text-[#FFD78A] text-sm font-mono tracking-widest placeholder:text-[#B9ADA0]/40 focus:outline-none focus:border-[#FFD78A] focus:ring-1 focus:ring-[#FFD78A] transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl btn-gold-3d text-[#080604] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 mt-2 disabled:opacity-50 shadow-gold"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#080604]" />
                  <span>Verifying &amp; Claiming...</span>
                </>
              ) : (
                <>
                  <Ticket className="w-4 h-4 text-[#080604]" />
                  <span>GET MY DIGITAL FOOD PASS</span>
                  <ArrowRight className="w-4 h-4 text-[#080604]" />
                </>
              )}
            </button>
          </form>

          {/* Security & One-Pass Guarantee */}
          <div className="mt-6 pt-5 border-t border-[#D9AC63]/20 flex items-center justify-center gap-2 text-[11px] text-[#B9ADA0]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Strict One-Time Food Redemption Guarantee</span>
          </div>
        </div>

        {/* Footer help */}
        <p className="text-[11px] text-center text-[#B9ADA0]/70 mt-6">
          S. G. Balekundri Institute of Technology, Belagavi
          <br />
          Department of Artificial Intelligence &amp; Data Science
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
