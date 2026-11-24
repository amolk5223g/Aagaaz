import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Print } from '../components/Print';
import { api } from '../services/api';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!import.meta.env.DEV) return;
    if (role === 'ADMIN') {
      setEmail('admin@sgbit.edu.in');
      setPassword('Aagazz@2026');
    } else {
      setEmail('volunteer@sgbit.edu.in');
      setPassword('Volunteer@2026');
    }
  };

  return (
    <main className="cover">
      <div className="cover__plate">
        <Print art="letteringSmall" className="cover__brand" />
        <h1>Coupon register</h1>
        <form onSubmit={handleLogin}>
          <div className="field">
            <label htmlFor="email">Staff email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" placeholder="name@sgbit.edu.in" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          {error && <p className="note note--bad" role="alert">{error}</p>}
          <button type="submit" disabled={loading} className="btn btn--red btn--wide">{loading ? 'Signing in' : 'Sign in'}</button>
        </form>
        {/* Seeded test logins. Never shipped: Vite drops this block from production builds. */}
        {import.meta.env.DEV && (
          <p className="cover__dev">
            Fill test login: <button type="button" className="link" onClick={() => fillCredentials('ADMIN')}>admin</button>,{' '}
            <button type="button" className="link" onClick={() => fillCredentials('VOLUNTEER')}>volunteer</button>
          </p>
        )}
      </div>
      <p className="cover__foot">Department of AI &amp; DS, SGBIT Belagavi</p>
    </main>
  );
};
