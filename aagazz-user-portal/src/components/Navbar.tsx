import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { useMusic } from './MusicProvider';
import { Print } from './Print';

const LINKS = [
  { to: '/', label: 'The party' },
  { to: '/register', label: 'Get coupon' },
  { to: '/coupon', label: 'My pass' },
];

export const Navbar: React.FC = () => {
  const { pathname } = useLocation();
  const { isPlaying, isMuted, toggle, toggleMute } = useMusic();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const usn = api.isAuthenticated() ? localStorage.getItem('aagazz_student_usn') : null;

  return (
    <header className={`bar ${open ? 'is-open' : ''}`}>
      <Link to="/" className="bar__brand" aria-label="Aagazz 2K26, home">
        <Print art="letteringSmall" ink={{ face: 'var(--red)' }} />
      </Link>
      <nav id="bar-links" className="bar__links" aria-label="Main">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} onClick={() => setOpenAt(null)} aria-current={pathname === l.to ? 'page' : undefined}>
            {l.label}
          </Link>
        ))}
        {usn && <span className="bar__usn">{usn}</span>}
      </nav>
      <div className="bar__music" data-music>
        <button onClick={toggle}>{isPlaying ? 'Stop anthem' : 'Play anthem'}</button>
        {isPlaying && <button onClick={toggleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>}
      </div>
      <button
        className="bar__menu"
        onClick={() => setOpenAt(open ? null : pathname)}
        aria-expanded={open}
        aria-controls="bar-links"
      >
        {open ? 'Close' : 'Menu'}
      </button>
    </header>
  );
};
