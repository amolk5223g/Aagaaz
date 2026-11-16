import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sparkles, Utensils, Award } from 'lucide-react';
import { api } from '../services/api';

export const Navbar: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const isAuthenticated = api.isAuthenticated();
  const studentUsn = localStorage.getItem('aagazz_student_usn');

  const navLinks = [
    { to: '/', label: 'Gala Experience', icon: Sparkles },
    { to: '/register', label: 'Claim Food Coupon', icon: Utensils },
    { to: '/coupon', label: 'My VIP Pass', icon: Award },
  ];

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 bg-[#080604]/85 backdrop-blur-xl border-b border-[#D9AC63]/20 shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
        <div className="max-w-6xl mx-auto h-20 px-4 flex items-center justify-between">
          {/* Logo & Department */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-[#15100C] border border-[#D9AC63]/40 flex items-center justify-center shadow-[0_0_15px_rgba(217,172,99,0.25)] group-hover:scale-105 transition-transform">
              <span className="text-[#FFD78A] text-lg font-serif">✦</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-wider text-[#FFD78A] group-hover:text-white transition-colors">
                AAGAZZ 2K26
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#D9AC63] font-semibold opacity-90">
                Dept. of AI & DS | SGBIT
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold transition-all py-1.5 px-3 rounded-lg ${
                    isActive
                      ? 'text-[#080604] bg-gradient-to-r from-[#FFD78A] to-[#D9AC63] shadow-gold'
                      : 'text-[#B9ADA0] hover:text-[#FFD78A] hover:bg-[#221F1B]/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-[#D9AC63]/30">
                <span className="text-xs text-[#FFD78A] font-mono font-semibold bg-[#221F1B] px-3 py-1.5 rounded-lg border border-[#D9AC63]/40 shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{studentUsn}</span>
                </span>
              </div>
            ) : null}
          </nav>

          {/* Mobile Right Bar */}
          <div className="flex items-center gap-2 md:hidden">
            <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#221F1B] text-[#FFD78A] border border-[#D9AC63]/30 font-bold">
              VIP GALA
            </span>

            <button
              onClick={() => setDrawerOpen(true)}
              className="w-10 h-10 rounded-xl bg-[#15100C] border border-[#D9AC63]/30 flex items-center justify-center text-[#FFD78A] active:scale-95 transition-transform"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Out Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative w-[82vw] max-w-sm h-full bg-[#15100C]/95 backdrop-blur-2xl border-l border-[#D9AC63]/30 p-6 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-6 border-b border-[#D9AC63]/20">
                <div className="flex items-center gap-2">
                  <span className="text-[#FFD78A] text-xl font-serif">✦</span>
                  <span className="font-serif text-lg font-bold text-[#FFD78A]">PORTAL ACCESS</span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-9 h-9 rounded-full bg-[#221F1B] text-[#B9ADA0] flex items-center justify-center active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="flex flex-col gap-2 mt-6">
                <span className="text-[10px] uppercase tracking-widest text-[#D9AC63]/70 font-semibold mb-1">
                  ✦ Navigation
                </span>
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-[#FFD78A] to-[#D9AC63] text-[#080604] font-bold shadow-gold'
                          : 'text-[#F8F2E8] hover:bg-[#221F1B] hover:text-[#FFD78A]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{link.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Student Session */}
              {isAuthenticated && (
                <div className="mt-8 p-4 rounded-xl bg-[#221F1B] border border-[#D9AC63]/30">
                  <span className="text-[10px] uppercase tracking-widest text-[#D9AC63] block mb-1">
                    Verified Student Pass
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="font-mono text-sm text-[#FFD78A] font-bold">{studentUsn}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="pt-6 border-t border-[#D9AC63]/20 text-center">
              <p className="text-[11px] text-[#B9ADA0]">
                S. G. Balekundri Institute of Technology
              </p>
              <p className="text-[10px] text-[#D9AC63] mt-0.5">
                AI & DS Department • Freshers 2026
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

