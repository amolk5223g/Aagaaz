import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  Users,
  Ticket,
  QrCode,
  LogOut,
  ShieldAlert,
  Menu,
  X
} from 'lucide-react';
import { api } from '../services/api';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = api.getCurrentUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  const adminNav = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/import', label: 'Import Whitelist', icon: UploadCloud },
    { to: '/students', label: 'Eligible Students', icon: Users },
    { to: '/coupons', label: 'Food Coupons', icon: Ticket },
    { to: '/volunteers', label: 'Volunteers', icon: ShieldAlert },
    { to: '/scanner', label: 'QR Scanner', icon: QrCode },
  ];

  const volunteerNav = [
    { to: '/scanner', label: 'Food QR Scanner', icon: QrCode },
  ];

  const navItems = isAdmin ? adminNav : volunteerNav;

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#080604] text-[#F8F2E8] overflow-hidden">
      {/* 1. Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#15100C] border-r border-[#D9AC63]/25 p-4 justify-between">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 py-4 border-b border-[#D9AC63]/20 mb-4">
            <div className="w-9 h-9 rounded-full bg-[#080604] border border-[#D9AC63]/50 flex items-center justify-center text-[#FFD78A] shadow-gold">
              <span className="font-serif font-bold text-base">✦</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg font-bold tracking-wider text-[#FFD78A]">
                AAGAZZ 2K26
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#D9AC63] font-bold">
                {isAdmin ? 'Admin Console' : 'Volunteer Station'}
              </span>
            </div>
          </div>

          {/* User Profile Pill */}
          <div className="p-3 rounded-xl bg-[#221F1B] border border-[#D9AC63]/20 mb-6 flex items-center justify-between">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-[#F8F2E8] truncate">
                {user?.fullName || 'Staff Member'}
              </span>
              <span className="text-[10px] text-[#B9ADA0] truncate">{user?.email}</span>
            </div>
            <span
              className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                isAdmin
                  ? 'bg-[#FFD78A] text-[#080604]'
                  : 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              {user?.role}
            </span>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FFD78A] to-[#D9AC63] text-[#080604] font-bold shadow-gold'
                      : 'text-[#B9ADA0] hover:text-[#FFD78A] hover:bg-[#221F1B]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-[#D9AC63]/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#221F1B] hover:bg-red-950/40 text-xs font-bold text-[#B9ADA0] hover:text-red-300 transition-colors border border-[#D9AC63]/20 hover:border-red-800/40"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between px-4 h-16 bg-[#15100C] border-b border-[#D9AC63]/25 z-30">
          <div className="flex items-center gap-2">
            <span className="text-[#FFD78A] text-lg font-serif">✦</span>
            <span className="font-serif text-base font-bold text-[#FFD78A]">AAGAZZ 2K26</span>
            <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-[#221F1B] text-[#D9AC63] font-bold border border-[#D9AC63]/30">
              {user?.role}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/scanner"
              className="p-2 rounded-lg bg-[#221F1B] text-[#FFD78A] border border-[#D9AC63]/30"
              title="Quick Scanner"
            >
              <QrCode className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-[#221F1B] text-[#FFD78A] border border-[#D9AC63]/30"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Slideout Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#15100C] border-b border-[#D9AC63]/30 p-4 flex flex-col gap-2 z-20">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FFD78A] to-[#D9AC63] text-[#080604] font-bold shadow-gold'
                      : 'text-[#F8F2E8] hover:bg-[#221F1B]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-950/40 text-xs font-bold text-red-300 border border-red-800/40"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Dynamic Route View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#080604]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
