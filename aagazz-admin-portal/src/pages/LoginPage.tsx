import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Shield, AlertCircle, RefreshCw, KeyRound, Clock } from 'lucide-react';
import { api } from '../services/api';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isExpired = searchParams.get('expired') === '1';

  useEffect(() => {
    if (isExpired) {
      api.logout();
    }
  }, [isExpired]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await api.login(email.trim(), password);
      if (user.role === 'ADMIN') {
        navigate('/dashboard');
      } else {
        navigate('/scanner');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (role: 'ADMIN' | 'VOLUNTEER') => {
    if (role === 'ADMIN') {
      setEmail('admin@sgbit.edu.in');
      setPassword('Aagazz@2026');
    } else {
      setEmail('volunteer@sgbit.edu.in');
      setPassword('Volunteer@2026');
    }
  };

  return (
    <div className="min-h-screen bg-[#080604] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Volumetric Gold Flare */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#D9AC63]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Logo Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-[#15100C] border border-[#D9AC63]/50 flex items-center justify-center text-[#FFD78A] mx-auto mb-3 shadow-gold">
            <Shield className="w-7 h-7" />
          </div>

          <h1 className="font-serif text-3xl font-bold gold-text-gradient">
            AAGAZZ 2K26
          </h1>
          <p className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#D9AC63] mt-1">
            Admin & Volunteer Operations Console
          </p>
          <p className="text-xs text-[#B9ADA0] mt-1">
            Department of AI & DS • SGBIT Belagavi
          </p>
        </div>

        {/* Login Box */}
        <div className="glass-luxury rounded-2xl p-6 sm:p-8 border border-[#D9AC63]/30 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#FFD78A] font-bold mb-1.5">
                Staff Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 absolute left-3.5 text-[#D9AC63] pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sgbit.edu.in"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#080604] border border-[#D9AC63]/30 text-[#F8F2E8] text-sm focus:outline-none focus:border-[#FFD78A] focus:shadow-gold transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#FFD78A] font-bold mb-1.5">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3.5 text-[#D9AC63] pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#080604] border border-[#D9AC63]/30 text-[#F8F2E8] text-sm focus:outline-none focus:border-[#FFD78A] focus:shadow-gold transition-all"
                />
              </div>
            </div>

            {isExpired && !error && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/50 flex items-start gap-2.5 text-xs text-amber-300">
                <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Your session has expired. Please log in again to access the operations console.</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 flex items-start gap-2.5 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-gold-3d w-full h-12 rounded-xl uppercase tracking-wider text-xs flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>SIGN IN TO CONSOLE</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credential Buttons */}
          <div className="mt-6 pt-5 border-t border-[#D9AC63]/20">
            <span className="text-[10px] uppercase tracking-wider text-[#B9ADA0] font-semibold block text-center mb-2">
              ⚡ Quick Fill Credentials for Testing
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('ADMIN')}
                className="py-1.5 px-2.5 rounded-lg bg-[#221F1B] hover:bg-[#2D2926] text-[11px] font-semibold text-[#FFD78A] border border-[#D9AC63]/25 flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3 h-3" />
                <span>Admin Login</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('VOLUNTEER')}
                className="py-1.5 px-2.5 rounded-lg bg-[#221F1B] hover:bg-[#2D2926] text-[11px] font-semibold text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3 h-3" />
                <span>Volunteer Login</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

