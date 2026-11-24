import React, { useState, useEffect } from 'react';
import { Pager, Sheet } from '../components/Ledger';
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

  const fields = (editing: boolean) => (
    <>
      <div className="field">
        <label htmlFor="s-usn">USN</label>
        <input
          id="s-usn"
          type="text"
          required
          disabled={editing}
          placeholder="2BU22AI045"
          value={editing ? selectedStudent?.usn ?? '' : formData.usn}
          onChange={(e) => setFormData({ ...formData, usn: e.target.value.toUpperCase() })}
        />
      </div>
      <div className="field">
        <label htmlFor="s-name">Full name</label>
        <input id="s-name" type="text" required value={formData.student_name} onChange={(e) => setFormData({ ...formData, student_name: e.target.value })} />
      </div>
      <div className="field">
        <label htmlFor="s-email">Email</label>
        <input id="s-email" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })} />
        <p>Login codes go to this address.</p>
      </div>
      <div className="field">
        <label htmlFor="s-year">Year</label>
        <select id="s-year" value={formData.year} onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}>
          <option value={1}>1st year</option>
          <option value={2}>2nd year</option>
          <option value={3}>3rd year</option>
          <option value={4}>4th year</option>
        </select>
      </div>
      {formError && <p className="note note--bad" role="alert">{formError}</p>}
    </>
  );

  return (
    <>
      {successToast && <p className="toast" role="status">{successToast}</p>}

      <header className="head">
        <h1>Students <small>{total}</small></h1>
        <div className="head__side">
          <button onClick={exportCsv} className="btn">Export this page</button>
          <button onClick={openAddModal} className="btn btn--red">Add student</button>
        </div>
      </header>

      <div className="tools">
        <form onSubmit={handleSearchSubmit} role="search">
          <input type="search" aria-label="Search students" placeholder="USN, name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn">Search</button>
        </form>
        <select
          aria-label="Filter students"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="ALL">All students</option>
          <option value="REGISTERED">Verified</option>
          <option value="UNREGISTERED">Not verified</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Deactivated</option>
        </select>
        <button onClick={loadStudents} className="btn" disabled={loading}>{loading ? 'Refreshing' : 'Refresh'}</button>
      </div>

      <div className="scroll">
        <table className="ledger">
          <thead>
            <tr><th>USN</th><th>Student</th><th>Email</th><th>Year</th><th>Email code</th><th>Coupon</th><th className="num">Action</th></tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan={7} className="none">{loading ? 'Loading students' : 'No students match. Clear the search or pick another filter.'}</td></tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className={student.is_active ? '' : 'is-struck'}>
                  <td className="code">{student.usn}</td>
                  <td>{student.student_name}</td>
                  <td className="clip" title={student.email}>{student.email}</td>
                  <td>{student.year || 1}</td>
                  <td>{student.is_registered ? <span className="stamp stamp--green">Verified</span> : 'Not yet'}</td>
                  <td>
                    {student.coupon_status === 'ACTIVE' && <span className="stamp stamp--blue">Ready</span>}
                    {student.coupon_status === 'REDEEMED' && <span className="stamp stamp--green">Redeemed</span>}
                    {student.coupon_status === 'REVOKED' && <span className="stamp stamp--red">Revoked</span>}
                    {!student.coupon_status && 'Not claimed'}
                  </td>
                  <td className="num acts">
                    <button onClick={() => openEditModal(student)} className="link">Edit</button>
                    <button onClick={() => handleToggleStatus(student)} className={`link ${student.is_active ? '' : 'good'}`}>
                      {student.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => openDeleteModal(student)} className="link bad">Remove</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pager page={page} total={total} setPage={setPage} />

      {showAddModal && (
        <Sheet title="Add student" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddSubmit}>
            {fields(false)}
            <div className="row">
              <button type="button" onClick={() => setShowAddModal(false)} className="btn">Cancel</button>
              <button type="submit" disabled={submitting} className="btn btn--red">{submitting ? 'Adding' : 'Add student'}</button>
            </div>
          </form>
        </Sheet>
      )}

      {showEditModal && selectedStudent && (
        <Sheet title="Edit student" onClose={() => setShowEditModal(false)}>
          <form onSubmit={handleEditSubmit}>
            {fields(true)}
            <div className="row">
              <button type="button" onClick={() => setShowEditModal(false)} className="btn">Cancel</button>
              <button type="submit" disabled={submitting} className="btn btn--red">{submitting ? 'Saving' : 'Save changes'}</button>
            </div>
          </form>
        </Sheet>
      )}

      {showDeleteModal && selectedStudent && (
        <Sheet title="Remove student" onClose={() => setShowDeleteModal(false)}>
          <p>Remove {selectedStudent.student_name} ({selectedStudent.usn}) from the list?</p>
          <ul>
            <li>Their coupon is revoked.</li>
            <li>Their login codes are deleted.</li>
            <li>This USN can no longer register or eat.</li>
          </ul>
          <div className="row">
            <button type="button" onClick={() => setShowDeleteModal(false)} className="btn">Keep student</button>
            <button type="button" onClick={handleDeleteConfirm} disabled={submitting} className="btn btn--red">{submitting ? 'Removing' : 'Remove student'}</button>
          </div>
        </Sheet>
      )}
    </>
  );
};
