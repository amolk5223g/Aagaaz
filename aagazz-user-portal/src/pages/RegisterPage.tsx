import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { Flame, Frame, Match, Print } from '../components/Print';
import { EVENT } from '../event';

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
      setError('Enter your college USN, for example 2BU22AI001.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('That email looks incomplete. Check the @ and the ending.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.sendOtp(cleanUsn, cleanEmail);
      setMaskedEmail(res.masked_email || cleanEmail);
      setTimeLeft(res.expires_in_seconds || 300);
      setCooldown(res.cooldown_seconds || 60);
      setStep('OTP');
      setSuccessMsg(`Code sent to ${res.masked_email || cleanEmail}.`);
    } catch (err: any) {
      setError(err.message || 'The code could not be sent. Check your USN and email, then try again.');
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
      setSuccessMsg(`New code sent to ${res.masked_email || email}.`);
    } catch (err: any) {
      setError(err.message || 'The new code could not be sent. Try again in a minute.');
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
      setError('The code is six digits. Check the email and try again.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyIdentity(cleanUsn, cleanEmail, cleanOtp);
      setSuccessMsg(res.message || 'Verified. Opening your pass.');

      // A shower of sparks
      confetti({
        particleCount: 160,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F6C915', '#E0301E', '#FFF6D8'],
        shapes: ['square'],
        scalar: 0.6,
        gravity: 1.5,
        startVelocity: 55,
        disableForReducedMotion: true
      });

      // Smooth transition to Food Pass
      setTimeout(() => {
        navigate('/coupon');
      }, 700);
    } catch (err: any) {
      setError(err.message || 'That code did not work. Check the email or ask for a new one.');
    } finally {
      setLoading(false);
    }
  };

  const verified = step === 'OTP' && !!successMsg && loading === false && otp.length === 6 && !error;

  return (
    <section className="reg">
      <div className={`reg__side ${error ? 'is-off' : ''}`} key={error ?? 'ok'}>
        <h1>{step === 'DETAILS' ? 'Open the box' : 'Six matches'}</h1>
        <div className="reg__emblem">
          <Print art="emblem" />
          {verified && <span className="hero__wick"><Flame /></span>}
        </div>
      </div>

      <div className="reg__main">
        <Frame className="slip">
          {step === 'DETAILS' ? (
            <form onSubmit={handleSendOtp}>
              <p className="slip__intro">
                Write your USN and the email on the AI &amp; DS list. We'll send a code to check it's you.
              </p>

              <div className="field">
                <label htmlFor="usn">College USN</label>
                <input
                  id="usn"
                  type="text"
                  placeholder="2BU22AI001"
                  value={usn}
                  onChange={(e) => setUsn(e.target.value.toUpperCase())}
                  autoComplete="username"
                  autoCapitalize="characters"
                  spellCheck={false}
                  required
                  autoFocus
                />
              </div>

              <div className="field">
                <label htmlFor="email">Registered email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="student@sgbit.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  autoComplete="email"
                  aria-describedby="email-help"
                  required
                />
                <p id="email-help">The one your faculty coordinator has for you.</p>
              </div>

              <button type="submit" disabled={loading} className="plaque plaque--red plaque--wide">
                {loading ? 'Sending the code' : 'Send my code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <p className="slip__intro">
                We sent six digits to {maskedEmail || 'your email'} for {usn}.{' '}
                <button
                  type="button"
                  className="link"
                  onClick={() => {
                    setStep('DETAILS');
                    setOtp('');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                >
                  Change details
                </button>
              </p>

              <div className="field">
                <label htmlFor="otp">Six-digit code</label>
                <div className="otp">
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                  />
                  <div className="otp__cells" aria-hidden="true">
                    {Array.from({ length: 6 }, (_, i) => (
                      <span key={i} className={i === otp.length ? 'is-next' : ''}>
                        <Match state={error && otp.length === 6 ? 'burnt' : otp[i] ? 'lit' : 'fresh'} />
                        <b>{otp[i]}</b>
                      </span>
                    ))}
                  </div>
                </div>
                <p>
                  {timeLeft > 0 ? `Each digit lights a match. They burn out in ${formatTimer(timeLeft)}.` : 'This code has expired. Ask for a new one.'}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6 || timeLeft === 0}
                className="plaque plaque--red plaque--wide"
              >
                {loading ? 'Checking the code' : 'Get my food coupon'}
              </button>

              <button type="button" className="link" onClick={handleResendOtp} disabled={cooldown > 0 || loading}>
                {cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code'}
              </button>
            </form>
          )}

          <div role="status">
            {error && <p className="notice notice--bad">{error}</p>}
            {successMsg && !error && <p className="notice">{successMsg}</p>}
          </div>
        </Frame>

        {api.isAuthenticated() && (
          <p className="reg__have">
            Already have a coupon? <button className="link" onClick={() => navigate('/coupon')}>Open my pass</button>
          </p>
        )}
        <p className="reg__have">One coupon per USN, for {EVENT.name} on {EVENT.dayMonth}.</p>
      </div>
    </section>
  );
};
