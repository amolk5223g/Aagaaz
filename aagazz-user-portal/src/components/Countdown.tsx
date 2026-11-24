import React, { useEffect, useState } from 'react';
import { EVENT } from '../event';
import { Match } from './Print';

const START = new Date(EVENT.startsAt).getTime();
const END = new Date(EVENT.endsAt).getTime();
const BOX = 50;
const pad = (n: number) => String(n).padStart(2, '0');

/** A box of fifty. One match burns for every day that passes. */
export const Countdown: React.FC = () => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const s = Math.max(0, Math.floor((START - now) / 1000));
  const days = Math.floor(s / 86400);
  const live = now >= START && now < END;
  const left = now >= END ? 0 : live ? 1 : Math.min(BOX, days);

  let title = `${days} ${days === 1 ? 'match' : 'matches'} left in the box`;
  let note = `One for each day, then ${pad(Math.floor(s / 3600) % 24)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}.`;
  if (days === 0) {
    title = 'Last match';
    note = `Starts in ${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}.`;
  }
  if (live) {
    title = 'It is lit';
    note = `Come in, ${EVENT.venue}. Till 2 PM.`;
  }
  if (now >= END) {
    title = 'Every match struck';
    note = "That's a wrap. Thanks for coming.";
  }

  return (
    <div className="count">
      <div className="count__text">
        <h3>{title}</h3>
        <p role="timer">{note}</p>
      </div>
      <div className="count__box" aria-hidden="true">
        {Array.from({ length: BOX }, (_, i) => (
          <Match key={i} state={i < left ? (live ? 'lit' : 'fresh') : 'burnt'} />
        ))}
      </div>
    </div>
  );
};
