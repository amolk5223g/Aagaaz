import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Match } from '../components/Print';
import { api } from '../services/api';
import type { AnalyticsData } from '../types';

export const DashboardPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getAnalytics();
      setAnalytics(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // 10s live refresh
    return () => clearInterval(interval);
  }, []);

  const handleToggleRegistration = async () => {
    if (!analytics) return;
    setToggleLoading(true);
    try {
      const newState = !analytics.registration_open;
      const updated = await api.toggleRegistration(newState);
      setAnalytics({ ...analytics, registration_open: updated });
    } catch (err: any) {
      alert(err.message || 'Failed to change registration state');
    } finally {
      setToggleLoading(false);
    }
  };

  if (loading && !analytics) {
    return <p className="wait" role="status"><Match state="lit" /> Opening the register</p>;
  }

  const issued = analytics?.total_coupons_generated ?? 0;
  const listed = analytics?.total_eligible_students ?? 0;
  const registered = analytics?.total_registered_students ?? 0;
  const redeemed = analytics?.redeemed_coupons ?? 0;
  const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0);
  const open = !!analytics?.registration_open;

  const rows: [string, number | undefined, string][] = [
    ['Students on the list', analytics?.total_eligible_students, 'AI & DS roster'],
    ['Registered', analytics?.total_registered_students, `${pct(registered, listed)}% of the list`],
    ['Coupons issued', analytics?.total_coupons_generated, 'one per USN'],
    ['Ready to use', analytics?.active_coupons, 'waiting for a scan'],
    ['Redeemed', analytics?.redeemed_coupons, `${pct(redeemed, issued)}% of issued`],
    ['Revoked', analytics?.revoked_coupons, 'turned off by an admin'],
    ['Meals remaining', analytics?.remaining_coupons, 'counter C102'],
  ];

  return (
    <>
      <header className="head">
        <h1>Today's page</h1>
        <div className="head__side">
          <p>Registration is <b className={open ? 'good' : 'bad'}>{open ? 'open' : 'closed'}</b></p>
          <button onClick={handleToggleRegistration} disabled={toggleLoading || !analytics} className={`btn ${open ? 'btn--red' : 'btn--green'}`}>
            {open ? 'Close registration' : 'Open registration'}
          </button>
        </div>
      </header>

      {error && <p className="note note--bad" role="alert">{error}</p>}

      <div className="day">
        <table className="ledger ledger--sum">
          <thead><tr><th>Entry</th><th className="num">Count</th><th>Particulars</th></tr></thead>
          <tbody>
            {rows.map(([name, n, info]) => (
              <tr key={name}><td>{name}</td><td className="num big">{n ?? 0}</td><td>{info}</td></tr>
            ))}
          </tbody>
        </table>

        <div className="tray">
          <h2>{redeemed} of {issued} meals served</h2>
          <div className="tray__box" role="img" aria-label={`${pct(redeemed, issued)} percent redeemed`}>
            {Array.from({ length: 50 }, (_, i) => <Match key={i} state={i < pct(redeemed, issued) / 2 ? 'burnt' : 'fresh'} />)}
          </div>
          <p>Each match stands for 2% of issued coupons. Burnt means served.</p>
          <h2>{registered} of {listed} registered</h2>
          <div className="tray__box" role="img" aria-label={`${pct(registered, listed)} percent registered`}>
            {Array.from({ length: 50 }, (_, i) => <Match key={i} state={i < pct(registered, listed) / 2 ? 'burnt' : 'fresh'} />)}
          </div>
          <p className="tray__links">
            <Link to="/scanner" className="btn btn--red">Scan coupons</Link>
            <Link to="/coupons" className="btn">Coupons</Link>
            <Link to="/import" className="btn">Import list</Link>
          </p>
        </div>
      </div>
    </>
  );
};
