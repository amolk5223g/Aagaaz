import React, { useState, useEffect } from 'react';
import { Sheet } from '../components/Ledger';
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
    <>
      <header className="head">
        <h1>Volunteers <small>{volunteers.length}</small></h1>
        <div className="head__side">
          <button onClick={() => setModalOpen(true)} className="btn btn--red">Add volunteer</button>
        </div>
      </header>
      <p className="lead">Volunteers can only open the scanner.</p>

      <div className="scroll">
        <table className="ledger">
          <thead><tr><th>Name</th><th>Email</th><th className="num">Scanned</th><th>Account</th><th className="num">Action</th></tr></thead>
          <tbody>
            {volunteers.length === 0 ? (
              <tr><td colSpan={5} className="none">{loading ? 'Loading volunteers' : 'No volunteers yet. Add one to start scanning.'}</td></tr>
            ) : (
              volunteers.map((vol) => (
                <tr key={vol.id}>
                  <td>{vol.full_name}</td>
                  <td>{vol.email}</td>
                  <td className="num big">{vol.redemption_count}</td>
                  <td>{vol.is_active ? <span className="stamp stamp--green">Active</span> : <span className="stamp stamp--red">Off</span>}</td>
                  <td className="num">
                    <button onClick={() => handleToggleStatus(vol)} className={`link ${vol.is_active ? 'bad' : 'good'}`}>
                      {vol.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <Sheet title="Add volunteer" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleCreateVolunteer}>
            <div className="field">
              <label htmlFor="v-name">Full name</label>
              <input id="v-name" type="text" required placeholder="Shubham Kadam" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="v-email">Email</label>
              <input id="v-email" type="email" required placeholder="volunteer@sgbit.edu.in" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="v-pass">Password</label>
              <input id="v-pass" type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="note note--bad" role="alert">{error}</p>}
            <div className="row">
              <button type="button" onClick={() => setModalOpen(false)} className="btn">Cancel</button>
              <button type="submit" disabled={createLoading} className="btn btn--red">{createLoading ? 'Adding' : 'Add volunteer'}</button>
            </div>
          </form>
        </Sheet>
      )}
    </>
  );
};
