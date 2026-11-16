import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Power
} from 'lucide-react';
import { api } from '../services/api';
import type { EligibleStudentItem } from '../types';

export const StudentListPage: React.FC = () => {
  const [students, setStudents] = useState<EligibleStudentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await api.getEligibleStudents(search, statusFilter, page, 50);
      setStudents(res.students);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadStudents();
  };

  const handleToggleStatus = async (student: EligibleStudentItem) => {
    const newStatus = !student.is_active;
    const confirmMsg = newStatus
      ? `Reactivate student ${student.usn}?`
      : `Deactivate student ${student.usn}? Deactivated students cannot register or redeem coupons.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.toggleStudentStatus(student.id, newStatus);
      setStudents(
        students.map((s) => (s.id === student.id ? { ...s, is_active: newStatus } : s))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update student state');
    }
  };

  const exportCsv = () => {
    if (students.length === 0) return;
    const header = 'USN,Student Name,Email,Department,Registered,Active,Coupon Status\n';
    const rows = students
      .map(
        (s) =>
          `"${s.usn}","${s.student_name}","${s.email}","${s.department}","${s.is_registered}","${s.is_active}","${s.coupon_status || 'NONE'}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eligible_students_aagazz_page_${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#FFD78A] text-lg font-serif">✦</span>
            <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#D9AC63]">
              Department Roster
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F2E8]">
            Eligible Students Whitelist ({total})
          </h1>
          <p className="text-xs text-[#B9ADA0] mt-1">
            Official list of approved AI & DS candidates eligible for AAGAZZ 2K26 food vouchers.
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="btn-dark-metallic px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm"
        >
          <Download className="w-4 h-4 text-[#FFD78A]" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-luxury rounded-2xl p-4 border border-[#D9AC63]/25 flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 text-[#D9AC63] top-3" />
          <input
            type="text"
            placeholder="Search by USN or Student Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#080604] border border-[#D9AC63]/30 text-xs text-[#F8F2E8] placeholder:text-[#B9ADA0]/50 focus:outline-none focus:border-[#FFD78A]"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-[#D9AC63]" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 rounded-xl bg-[#080604] border border-[#D9AC63]/30 text-xs text-[#FFD78A] font-semibold focus:outline-none"
          >
            <option value="ALL">All Students</option>
            <option value="REGISTERED">Registered Only</option>
            <option value="UNREGISTERED">Unregistered</option>
            <option value="ACTIVE">Active Profiles</option>
            <option value="INACTIVE">Deactivated Profiles</option>
          </select>

          <button
            onClick={loadStudents}
            className="p-2.5 rounded-xl bg-[#15100C] border border-[#D9AC63]/30 text-[#FFD78A] hover:bg-[#221F1B]"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Whitelist Students Table */}
      <div className="glass-luxury rounded-2xl border border-[#D9AC63]/25 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#15100C] text-[#FFD78A] border-b border-[#D9AC63]/20">
              <tr>
                <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider">USN</th>
                <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider">Student Name</th>
                <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider hidden sm:table-cell">Year</th>
                <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider">Registration</th>
                <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider">Coupon Status</th>
                <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider">Access State</th>
                <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#221F1B]">
              {loading && students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#B9ADA0]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#D9AC63]" />
                    <span>Loading student records...</span>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#B9ADA0]">
                    No students match the selected filter.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-[#15100C]/60 text-[#F8F2E8]">
                    <td className="p-3.5 font-mono font-bold text-[#FFD78A]">{student.usn}</td>
                    <td className="p-3.5 font-semibold">{student.student_name}</td>
                    <td className="p-3.5 text-[#FFD78A] font-semibold hidden sm:table-cell">Year {student.year}</td>
                    <td className="p-3.5">
                      {student.is_registered ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                          VERIFIED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-[#221F1B] text-[#B9ADA0] text-[10px]">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {student.coupon_status === 'ACTIVE' && (
                        <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>ACTIVE</span>
                        </span>
                      )}
                      {student.coupon_status === 'REDEEMED' && (
                        <span className="text-amber-400 font-bold text-[11px]">REDEEMED</span>
                      )}
                      {student.coupon_status === 'REVOKED' && (
                        <span className="text-red-400 font-bold text-[11px]">REVOKED</span>
                      )}
                      {!student.coupon_status && (
                        <span className="text-[#B9ADA0] text-[11px]">None</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {student.is_active ? (
                        <span className="text-emerald-400 text-[11px] font-semibold">Active</span>
                      ) : (
                        <span className="text-red-400 text-[11px] font-semibold">Deactivated</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleToggleStatus(student)}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          student.is_active
                            ? 'text-red-400 hover:bg-red-950/40'
                            : 'text-emerald-400 hover:bg-emerald-950/40'
                        }`}
                        title={student.is_active ? 'Deactivate student' : 'Reactivate student'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3.5 bg-[#15100C] border-t border-[#D9AC63]/20 flex items-center justify-between text-xs text-[#B9ADA0]">
          <span>Page {page} of {Math.ceil(total / 50) || 1}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded bg-[#080604] border border-[#D9AC63]/30 text-[#FFD78A] disabled:opacity-30"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 50 >= total}
              className="px-3 py-1 rounded bg-[#080604] border border-[#D9AC63]/30 text-[#FFD78A] disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
