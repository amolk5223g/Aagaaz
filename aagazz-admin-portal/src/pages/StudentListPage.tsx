import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Power,
  Plus,
  Edit2,
  Trash2,
  X,
  Mail,
  User,
  GraduationCap,
  AlertTriangle,
  CheckCircle2
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

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<EligibleStudentItem | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    usn: '',
    student_name: '',
    email: '',
    year: 1,
    department: 'AI & DS',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

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

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadStudents();
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormData({
      usn: '',
      student_name: '',
      email: '',
      year: 1,
      department: 'AI & DS',
    });
    setFormError(null);
    setShowAddModal(true);
  };

  // Open Edit Modal
  const openEditModal = (student: EligibleStudentItem) => {
    setSelectedStudent(student);
    setFormData({
      usn: student.usn,
      student_name: student.student_name,
      email: student.email,
      year: student.year || 1,
      department: student.department || 'AI & DS',
    });
    setFormError(null);
    setShowEditModal(true);
  };

  // Open Delete Modal
  const openDeleteModal = (student: EligibleStudentItem) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };

  // Submit Add Student
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanUsn = formData.usn.trim().toUpperCase();
    const cleanName = formData.student_name.trim();
    const cleanEmail = formData.email.trim().toLowerCase();

    if (!cleanUsn) {
      setFormError('University Seat Number (USN) is required.');
      return;
    }
    if (!cleanName) {
      setFormError('Student full name is required.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setFormError('A valid email address is required.');
      return;
    }

    try {
      setSubmitting(true);
      const newStudent = await api.createStudent({
        usn: cleanUsn,
        student_name: cleanName,
        email: cleanEmail,
        year: Number(formData.year) || 1,
        department: 'AI & DS',
      });

      setShowAddModal(false);
      showNotification(`Student ${newStudent.usn} added successfully!`);
      // Prepend to current list
      setStudents((prev) => [newStudent, ...prev]);
      setTotal((prev) => prev + 1);
    } catch (err: any) {
      setFormError(err.message || 'Failed to add student. Please check details.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Student
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setFormError(null);

    const cleanName = formData.student_name.trim();
    const cleanEmail = formData.email.trim().toLowerCase();

    if (!cleanName) {
      setFormError('Student name cannot be empty.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setFormError('A valid email address is required.');
      return;
    }

    try {
      setSubmitting(true);
      const updated = await api.updateStudent(selectedStudent.id, {
        student_name: cleanName,
        email: cleanEmail,
        year: Number(formData.year) || 1,
      });

      setShowEditModal(false);
      showNotification(`Student ${updated.usn} updated successfully!`);
      setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err: any) {
      setFormError(err.message || 'Failed to update student.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Delete Student
  const handleDeleteConfirm = async () => {
    if (!selectedStudent) return;

    try {
      setSubmitting(true);
      await api.deleteStudent(selectedStudent.id);
      setShowDeleteModal(false);
      showNotification(`Student ${selectedStudent.usn} has been removed.`);
      setStudents((prev) => prev.filter((s) => s.id !== selectedStudent.id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      alert(err.message || 'Failed to remove student.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active / Deactive State
  const handleToggleStatus = async (student: EligibleStudentItem) => {
    const newStatus = !student.is_active;
    const confirmMsg = newStatus
      ? `Reactivate student ${student.usn}?`
      : `Deactivate student ${student.usn}? Deactivated students cannot claim OTP or redeem food passes.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.toggleStudentStatus(student.id, newStatus);
      setStudents(
        students.map((s) => (s.id === student.id ? { ...s, is_active: newStatus } : s))
      );
      showNotification(`Student ${student.usn} ${newStatus ? 'reactivated' : 'deactivated'}.`);
    } catch (err: any) {
      alert(err.message || 'Failed to update student state');
    }
  };

  const exportCsv = () => {
    if (students.length === 0) return;
    const header = 'USN,Student Name,Email,Department,Year,Registered,Active,Coupon Status\n';
    const rows = students
      .map(
        (s) =>
          `"${s.usn}","${s.student_name}","${s.email}","${s.department}","${s.year}","${s.is_registered}","${s.is_active}","${s.coupon_status || 'NONE'}"`
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
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs shadow-2xl backdrop-blur-md animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#FFD78A] text-lg font-serif">✦</span>
            <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#D9AC63]">
              Faculty Management Console
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F2E8]">
            Student Roster & Verification ({total})
          </h1>
          <p className="text-xs text-[#B9ADA0] mt-1">
            Authorized student records eligible for email OTP verification and food pass access.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#080604] bg-gradient-to-r from-[#D9AC63] to-[#FFD78A] hover:brightness-110 flex items-center gap-1.5 shadow-lg shadow-[#D9AC63]/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>

          <button
            onClick={exportCsv}
            className="btn-dark-metallic px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm border border-[#D9AC63]/30 text-[#F8F2E8] hover:border-[#D9AC63]"
          >
            <Download className="w-4 h-4 text-[#FFD78A]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-luxury rounded-2xl p-4 border border-[#D9AC63]/25 flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 text-[#D9AC63] top-3" />
          <input
            type="text"
            placeholder="Search by USN, Name, or Email Address..."
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
            <option value="REGISTERED">Verified Passes</option>
            <option value="UNREGISTERED">Pending Verification</option>
            <option value="ACTIVE">Active Profiles</option>
            <option value="INACTIVE">Deactivated</option>
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

      {/* Students Table */}
      <div className="glass-luxury rounded-2xl border border-[#D9AC63]/25 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#15100C] text-[#FFD78A] border-b border-[#D9AC63]/20">
              <tr>
                <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider">USN</th>
                <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider">Student Name</th>
                <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider">Registered Email</th>
                <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider hidden sm:table-cell">Year</th>
                <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider">OTP Status</th>
                <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider">Pass State</th>
                <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider text-right">Actions</th>
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
                  <tr key={student.id} className="hover:bg-[#15100C]/60 text-[#F8F2E8] transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#FFD78A]">{student.usn}</td>
                    <td className="p-3.5 font-semibold">{student.student_name}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 text-[#B9ADA0] font-mono text-[11px]">
                        <Mail className="w-3.5 h-3.5 text-[#D9AC63] shrink-0" />
                        <span className="truncate max-w-[200px]" title={student.email}>
                          {student.email}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 text-[#FFD78A] font-semibold hidden sm:table-cell">
                      Year {student.year || 1}
                    </td>
                    <td className="p-3.5">
                      {student.is_registered ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                          VERIFIED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-[#221F1B] text-[#B9ADA0] text-[10px] border border-[#332A22]">
                          Unverified
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
                        <span className="text-[#7C766B] text-[11px]">Not Claimed</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Button */}
                        <button
                          onClick={() => openEditModal(student)}
                          className="p-1.5 rounded-lg text-[#FFD78A] hover:bg-[#221F1B] border border-transparent hover:border-[#D9AC63]/30 transition-colors"
                          title="Edit Student Information"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle Status Button */}
                        <button
                          onClick={() => handleToggleStatus(student)}
                          className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            student.is_active
                              ? 'text-amber-400 hover:bg-amber-950/40'
                              : 'text-emerald-400 hover:bg-emerald-950/40'
                          }`}
                          title={student.is_active ? 'Deactivate student access' : 'Reactivate student access'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        {/* Remove / Delete Button */}
                        <button
                          onClick={() => openDeleteModal(student)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/40 transition-colors"
                          title="Remove student record permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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

      {/* ADD STUDENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#15100C] border border-[#D9AC63]/40 rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-[#B9ADA0] hover:text-[#F8F2E8] p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#FFD78A]">✦</span>
              <span className="text-xs uppercase font-bold tracking-wider text-[#D9AC63]">
                Faculty Action
              </span>
            </div>
            <h2 className="text-xl font-serif font-bold text-[#F8F2E8] mb-1">
              Add Individual Student
            </h2>
            <p className="text-xs text-[#B9ADA0] mb-5">
              Enter the student's details. Once saved, they can immediately receive email OTPs to access their food pass.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#FFD78A] mb-1.5">
                  University Seat Number (USN) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-[#D9AC63]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2BU22AI045"
                    value={formData.usn}
                    onChange={(e) => setFormData({ ...formData, usn: e.target.value.toUpperCase() })}
                    className="w-full h-10 pl-10 pr-3 rounded-xl bg-[#080604] border border-[#D9AC63]/30 text-xs text-[#F8F2E8] uppercase placeholder:text-[#B9ADA0]/40 focus:outline-none focus:border-[#FFD78A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#FFD78A] mb-1.5">
                  Student Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formData.student_name}
                  onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-[#080604] border border-[#D9AC63]/30 text-xs text-[#F8F2E8] placeholder:text-[#B9ADA0]/40 focus:outline-none focus:border-[#FFD78A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#FFD78A] mb-1.5">
                  Approved Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-[#D9AC63]" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul.sharma@sgbit.edu.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                    className="w-full h-10 pl-10 pr-3 rounded-xl bg-[#080604] border border-[#D9AC63]/30 text-xs text-[#F8F2E8] placeholder:text-[#B9ADA0]/40 focus:outline-none focus:border-[#FFD78A]"
                  />
                </div>
                <p className="text-[11px] text-[#B9ADA0]/70 mt-1">
                  6-digit verification passcodes will be dispatched to this email.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#FFD78A] mb-1.5">
                    Academic Year
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 absolute left-3 top-3 text-[#D9AC63]" />
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                      className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#080604] border border-[#D9AC63]/30 text-xs text-[#F8F2E8] focus:outline-none focus:border-[#FFD78A]"
                    >
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#FFD78A] mb-1.5">
                    Department
                  </label>
                  <input
                    type="text"
                    disabled
                    value="AI & DS"
                    className="w-full h-10 px-3 rounded-xl bg-[#080604]/50 border border-[#D9AC63]/20 text-xs text-[#D9AC63] font-bold cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#D9AC63]/30 text-xs font-semibold text-[#B9ADA0] hover:text-[#F8F2E8] hover:bg-[#221F1B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[#080604] bg-gradient-to-r from-[#D9AC63] to-[#FFD78A] hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STUDENT MODAL */}
      {showEditModal && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#15100C] border border-[#D9AC63]/40 rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-[#B9ADA0] hover:text-[#F8F2E8] p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#FFD78A]">✦</span>
              <span className="text-xs uppercase font-bold tracking-wider text-[#D9AC63]">
                Edit Student Details
              </span>
            </div>
            <h2 className="text-xl font-serif font-bold text-[#F8F2E8] mb-1">
              {selectedStudent.usn}
            </h2>
            <p className="text-xs text-[#B9ADA0] mb-5">
              Update name, email, or academic year. Changes reflect immediately in verification lookups.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#FFD78A] mb-1.5">
                  USN (Immutable)
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedStudent.usn}
                  className="w-full h-10 px-3 rounded-xl bg-[#080604]/50 border border-[#D9AC63]/20 text-xs text-[#FFD78A] font-mono font-bold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#FFD78A] mb-1.5">
                  Student Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.student_name}
                  onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-[#080604] border border-[#D9AC63]/30 text-xs text-[#F8F2E8] focus:outline-none focus:border-[#FFD78A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#FFD78A] mb-1.5">
                  Registered Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-[#D9AC63]" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                    className="w-full h-10 pl-10 pr-3 rounded-xl bg-[#080604] border border-[#D9AC63]/30 text-xs text-[#F8F2E8] focus:outline-none focus:border-[#FFD78A]"
                  />
                </div>
                <p className="text-[11px] text-[#B9ADA0]/70 mt-1">
                  Subsequent OTPs will be delivered to this newly updated email.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#FFD78A] mb-1.5">
                  Academic Year
                </label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-xl bg-[#080604] border border-[#D9AC63]/30 text-xs text-[#F8F2E8] focus:outline-none focus:border-[#FFD78A]"
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#D9AC63]/30 text-xs font-semibold text-[#B9ADA0] hover:text-[#F8F2E8] hover:bg-[#221F1B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[#080604] bg-gradient-to-r from-[#D9AC63] to-[#FFD78A] hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#15100C] border border-red-500/40 rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-[#B9ADA0] hover:text-[#F8F2E8] p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-serif font-bold text-[#F8F2E8] mb-2">
              Remove Student Record?
            </h2>
            <div className="text-xs text-[#B9ADA0] space-y-2 mb-6">
              <p>
                Are you sure you want to remove <strong className="text-[#FFD78A]">{selectedStudent.student_name}</strong> (
                <span className="font-mono text-[#F8F2E8]">{selectedStudent.usn}</span>)?
              </p>
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200">
                <p className="font-semibold mb-1">Impact of this action:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>Revokes any issued food coupon or pass</li>
                  <li>Deletes all associated OTP verification sessions</li>
                  <li>Prevents this USN from registering or redeeming food vouchers</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#D9AC63]/30 text-xs font-semibold text-[#B9ADA0] hover:text-[#F8F2E8] hover:bg-[#221F1B]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Removing...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
