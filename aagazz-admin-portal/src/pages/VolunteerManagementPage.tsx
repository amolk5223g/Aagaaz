import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Power,
  RefreshCw,
  QrCode,
  AlertCircle,
  Lock,
  Mail,
  User
} from 'lucide-react';
import { api } from '../services/api';
import type { VolunteerItem } from '../types';

export const VolunteerManagementPage: React.FC = () => {
  const [volunteers, setVolunteers] = useState<VolunteerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // New volunteer form
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVolunteers = async () => {
    try {
      setLoading(true);
      const data = await api.getVolunteers();
      setVolunteers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVolunteers();
  }, []);

  const handleToggleStatus = async (vol: VolunteerItem) => {
    const nextStatus = !vol.is_active;
    if (!window.confirm(`Set volunteer ${vol.full_name} status to ${nextStatus ? 'Active' : 'Inactive'}?`)) return;

    try {
      await api.toggleVolunteerStatus(vol.id, nextStatus);
      setVolunteers(
        volunteers.map((v) => (v.id === vol.id ? { ...v, is_active: nextStatus } : v))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update volunteer status');
    }
  };

  const handleCreateVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreateLoading(true);

    try {
      await api.createVolunteer({
        email: email.trim(),
        full_name: fullName.trim(),
        password: password,
      });
      setModalOpen(false);
      setEmail('');
      setFullName('');
      setPassword('');
      loadVolunteers();
    } catch (err: any) {
      setError(err.message || 'Failed to create volunteer account');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#FFD78A] text-lg font-serif">✦</span>
            <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#D9AC63]">
              Staff & Scanner Accounts
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F2E8]">
            Volunteer Operations Staff ({volunteers.length})
          </h1>
          <p className="text-xs text-[#B9ADA0] mt-1">
            Authorized volunteers permitted to scan student QR food coupons at banquet stations.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn-gold-3d px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold flex items-center gap-2 shadow-gold"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Volunteer Account</span>
        </button>
      </div>

      {/* Volunteer Grid */}
      {loading && volunteers.length === 0 ? (
        <div className="p-8 text-center text-[#B9ADA0]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#D9AC63]" />
          <span>Loading volunteer accounts...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {volunteers.map((vol) => (
          <div
            key={vol.id}
            className="glass-luxury rounded-2xl p-5 border border-[#D9AC63]/25 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-[#221F1B] border border-[#D9AC63]/40 flex items-center justify-center text-[#FFD78A]">
                  <QrCode className="w-5 h-5" />
                </div>
                <span
                  className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    vol.is_active
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                      : 'bg-red-950/80 text-red-400 border border-red-500/40'
                  }`}
                >
                  {vol.is_active ? 'Active' : 'Deactivated'}
                </span>
              </div>

              <h3 className="font-serif text-base font-bold text-[#F8F2E8]">
                {vol.full_name}
              </h3>
              <p className="text-xs text-[#B9ADA0] font-mono mt-0.5 truncate">{vol.email}</p>
            </div>

            <div className="pt-4 mt-4 border-t border-[#D9AC63]/20 flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase text-[#B9ADA0] block">Coupons Scanned</span>
                <span className="font-mono text-base font-bold text-[#FFD78A]">
                  {vol.redemption_count}
                </span>
              </div>

              <button
                onClick={() => handleToggleStatus(vol)}
                className={`p-1.5 rounded-lg text-xs font-semibold ${
                  vol.is_active
                    ? 'text-red-400 hover:bg-red-950/40'
                    : 'text-emerald-400 hover:bg-emerald-950/40'
                }`}
                title={vol.is_active ? 'Deactivate volunteer' : 'Activate volunteer'}
              >
                <Power className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Create Volunteer Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-luxury max-w-md w-full p-6 sm:p-8 rounded-2xl border border-[#D9AC63]/40 shadow-2xl">
            <h3 className="font-serif text-xl font-bold text-[#F8F2E8] mb-1">
              Add New Volunteer
            </h3>
            <p className="text-xs text-[#B9ADA0] mb-4">
              Create credentials for an authorized event volunteer. Volunteers can only access the QR scanner.
            </p>

            <form onSubmit={handleCreateVolunteer} className="space-y-3.5">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#FFD78A] font-bold mb-1">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 absolute left-3 text-[#D9AC63]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shubham Kadam"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#080604] border border-[#D9AC63]/30 text-xs text-[#F8F2E8] focus:outline-none focus:border-[#FFD78A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#FFD78A] font-bold mb-1">
                  Volunteer Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-3 text-[#D9AC63]" />
                  <input
                    type="email"
                    required
                    placeholder="volunteer@sgbit.edu.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#080604] border border-[#D9AC63]/30 text-xs text-[#F8F2E8] focus:outline-none focus:border-[#FFD78A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#FFD78A] font-bold mb-1">
                  Assigned Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3 text-[#D9AC63]" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#080604] border border-[#D9AC63]/30 text-xs text-[#F8F2E8] focus:outline-none focus:border-[#FFD78A]"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#221F1B] text-xs font-semibold text-[#B9ADA0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="btn-gold-3d px-5 py-2 rounded-xl text-xs uppercase tracking-wider font-bold"
                >
                  {createLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
