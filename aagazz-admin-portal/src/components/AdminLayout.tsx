import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { api } from '../services/api';
import { Print } from './Print';

const ADMIN_NAV = [
  { to: '/dashboard', label: "Today's page" },
  { to: '/students', label: 'Students' },
  { to: '/import', label: 'Import list' },
  { to: '/coupons', label: 'Coupons' },
  { to: '/volunteers', label: 'Volunteers' },
  { to: '/scanner', label: 'Scan' },
];

const VOLUNTEER_NAV = [{ to: '/scanner', label: 'Scan' }];

export const AdminLayout: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = api.getCurrentUser();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  return (
    <div className={`book ${open ? 'is-open' : ''}`}>
      <aside className="spine">
        <Link to="/" className="spine__brand" aria-label="Aagazz register, home"><Print art="letteringSmall" /></Link>
        <button className="spine__menu" onClick={() => setOpenAt(open ? null : pathname)} aria-expanded={open} aria-controls="spine-nav">
          {open ? 'Close' : 'Index'}
        </button>
        <nav id="spine-nav" aria-label="Register index">
          {(isAdmin ? ADMIN_NAV : VOLUNTEER_NAV).map((item) => (
            <Link key={item.to} to={item.to} onClick={() => setOpenAt(null)} aria-current={pathname === item.to ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="spine__user">
          <p>{user?.fullName || 'Staff member'}<br /><small>{isAdmin ? 'Admin' : 'Volunteer'}, {user?.email}</small></p>
          <button onClick={handleLogout} className="link">Sign out</button>
        </div>
      </aside>
      <main className="page"><Outlet /></main>
    </div>
  );
};
