import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Fingerprint,
  Mail,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  Clock,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  // Workflow Step: 'DETAILS' | 'OTP'
  const [step, setStep] = useState<'DETAILS' | 'OTP'>('DETAILS');

  // Step 1 Inputs
  const [usn, setUsn] = useState('');
  const [email, setEmail] = useState('');

  // Step 2 Inputs
  const [otp, setOtp] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // Timers
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [cooldown, setCooldown] = useState(60); // 60 seconds resend cooldown

  // Feedback & Loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 5-minute OTP countdown & 60-second resend cooldown
  useEffect(() => {
    let timer: any;
    if (step === 'OTP' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  useEffect(() => {
    let cooldownTimer: any;
    if (step === 'OTP' && cooldown > 0) {
      cooldownTimer = setInterval(() => {
        setCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(cooldownTimer);
  }, [step, cooldown]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanUsn = usn.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsn) {
      setError('Please enter your official College USN.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid college email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.sendOtp(cleanUsn, cleanEmail);
      setMaskedEmail(res.masked_email || cleanEmail);
      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
      }
      setTimeLeft(res.expires_in_seconds || 300);
      setCooldown(res.cooldown_seconds || 60);
      setStep('OTP');
      setSuccessMsg(`Passcode sent successfully to ${res.masked_email || cleanEmail}`);
    } catch (err: any) {
      setError(err.message || 'Unable to send passcode. Please check your USN and registered email.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return;
    setError(null);
    setSuccessMsg(null);

    setLoading(true);
    try {
      const res = await api.sendOtp(usn.trim().toUpperCase(), email.trim().toLowerCase());
      setTimeLeft(res.expires_in_seconds || 300);
      setCooldown(res.cooldown_seconds || 60);
      if (res.dev_otp) setDevOtp(res.dev_otp);
      setSuccessMsg(`A new passcode has been dispatched to ${res.masked_email || email}`);
    } catch (err: any) {
      setError(err.message || 'Failed to resend passcode. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Claim Pass
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanUsn = usn.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d+$/.test(cleanOtp)) {
      setError('Please enter a valid 6-digit numeric passcode.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyIdentity(cleanUsn, cleanEmail, cleanOtp);
      setSuccessMsg(res.message || 'Verification successful! Unlocking your pass...');

      // Celebratory golden confetti
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FFD78A', '#D9AC63', '#B88643', '#FFFFFF']
      });

      // Smooth transition to Food Pass
      setTimeout(() => {
        navigate('/coupon');
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the passcode and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background radial gold glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-[#D9AC63]/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Card Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#15100C] border border-[#D9AC63]/40 text-[#FFD78A] text-[11px] font-bold uppercase tracking-widest mb-3 shadow-gold">
            <Sparkles className="w-3.5 h-3.5 text-[#D9AC63]" />
            <span>AI &amp; DS Department • SGBIT</span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F2E8] tracking-wide">
            {step === 'DETAILS' ? 'STUDENT VERIFICATION' : 'ENTER PASSCODE'}
          </h1>
          <p className="text-xs text-[#B9ADA0] mt-1.5 max-w-xs mx-auto">
            {step === 'DETAILS'
              ? 'Enter your approved College USN and registered Email ID to claim your official AAGAZZ 2K26 Food Pass.'
              : `A 6-digit one-time passcode was sent to ${maskedEmail || 'your email'}.`}
          </p>
        </div>

        {/* Main Form Card */}
        <div className="glass-luxury rounded-3xl p-6 sm:p-8 border border-[#D9AC63]/30 shadow-[0_12px_40px_rgba(0,0,0,0.85)] relative overflow-hidden">
          {/* Top Gold Accent Line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#FFD78A] to-transparent" />

          {/* Dev OTP Helper Banner (if active) */}
          {devOtp && step === 'OTP' && (
            <div className="mb-4 p-3 rounded-xl bg-[#221F1B] border border-[#FFD78A]/50 text-xs text-[#FFD78A] flex items-center justify-between">
              <div>
                <span className="font-bold text-[10px] uppercase tracking-wider block text-[#D9AC63]">
                  Development Mode Passcode
                </span>
                <span className="font-mono text-base font-bold tracking-widest">{devOtp}</span>
              </div>
              <button
                type="button"
                onClick={() => setOtp(devOtp)}
                className="px-2.5 py-1 rounded-lg bg-[#D9AC63]/20 hover:bg-[#D9AC63]/30 text-[10px] font-bold text-[#FFD78A] transition-colors"
              >
                Auto Fill
              </button>
            </div>
          )}

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

          {/* STEP 1: USN + EMAIL INPUT FORM */}
          {step === 'DETAILS' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {/* USN Input */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#FFD78A] font-bold mb-1.5">
                  College USN <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Fingerprint className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D9AC63]" />
                  <input
                    type="text"
                    placeholder="e.g. 2BU22AI001"
                    value={usn}
                    onChange={(e) => setUsn(e.target.value.toUpperCase())}
                    required
                    autoFocus
                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-[#080604] border border-[#D9AC63]/35 text-[#F8F2E8] text-sm font-mono tracking-wider placeholder:text-[#B9ADA0]/40 focus:outline-none focus:border-[#FFD78A] focus:ring-1 focus:ring-[#FFD78A] transition-all"
                  />
                </div>
                <span className="text-[10px] text-[#B9ADA0] mt-1 block">
                  Must be registered in the official AI &amp; DS whitelist roster.
                </span>
              </div>

              {/* Registered Email Input */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#FFD78A] font-bold mb-1.5">
                  Registered Email Address <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D9AC63]" />
                  <input
                    type="email"
                    placeholder="e.g. student@sgbit.edu.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    required
                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-[#080604] border border-[#D9AC63]/35 text-[#F8F2E8] text-sm placeholder:text-[#B9ADA0]/40 focus:outline-none focus:border-[#FFD78A] focus:ring-1 focus:ring-[#FFD78A] transition-all"
                  />
                </div>
                <span className="text-[10px] text-[#B9ADA0] mt-1 block">
                  Must match the approved email provided by your faculty coordinator.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-gold-3d w-full h-12 rounded-xl uppercase tracking-wider text-xs flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#080604]" />
                    <span>Validating &amp; Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-[#080604]" />
                    <span>Send Verification Code</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-[#B9ADA0]">
                <ShieldCheck className="w-4 h-4 text-[#D9AC63]" />
                <span>Secure 256-bit encrypted faculty verification</span>
              </div>
            </form>
          ) : (
            /* STEP 2: 6-DIGIT OTP VERIFICATION FORM */
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {/* USN / Email summary pill */}
              <div className="p-3 rounded-xl bg-[#080604] border border-[#D9AC63]/20 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#FFD78A] font-mono font-bold block">{usn}</span>
                  <span className="text-[#B9ADA0] text-[11px] truncate max-w-[200px] block">
                    {maskedEmail || email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('DETAILS');
                    setOtp('');
                    setError(null);
                  }}
                  className="text-[11px] text-[#D9AC63] hover:text-[#FFD78A] underline font-semibold flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Change</span>
                </button>
              </div>

              {/* 6-digit OTP Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] uppercase tracking-wider text-[#FFD78A] font-bold">
                    6-Digit Passcode <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-[#D9AC63]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Expires in {formatTimer(timeLeft)}</span>
                  </div>
                </div>

                <div className="relative">
                  <KeyRound className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D9AC63]" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                    className="w-full h-14 pl-11 pr-4 rounded-xl bg-[#080604] border border-[#D9AC63]/40 text-[#FFD78A] text-2xl font-mono tracking-[0.5em] text-center placeholder:text-[#B9ADA0]/30 focus:outline-none focus:border-[#FFD78A] focus:ring-1 focus:ring-[#FFD78A] transition-all"
                  />
                </div>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || otp.length !== 6 || timeLeft === 0}
                className="btn-gold-3d w-full h-12 rounded-xl uppercase tracking-wider text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#080604]" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify &amp; Claim Food Pass</span>
                    <ArrowRight className="w-4 h-4 text-[#080604]" />
                  </>
                )}
              </button>

              {/* Resend Cooldown Controls */}
              <div className="flex items-center justify-between pt-2 text-xs border-t border-[#D9AC63]/15">
                <span className="text-[#B9ADA0] text-[11px]">Didn't receive the code?</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0 || loading}
                  className="text-xs font-semibold text-[#FFD78A] hover:text-white disabled:text-[#7C766B] disabled:cursor-not-allowed transition-colors"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Existing Coupon Shortcut */}
        {api.isAuthenticated() && (
          <div className="text-center mt-5">
            <button
              onClick={() => navigate('/coupon')}
              className="text-xs text-[#D9AC63] hover:text-[#FFD78A] underline font-medium transition-colors"
            >
              Already verified? View your existing Food Pass →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
