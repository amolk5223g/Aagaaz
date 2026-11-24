import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Countdown } from '../components/Countdown';
import { Hero } from '../components/Hero';
import { Arc, Frame, Print } from '../components/Print';
import { Ticket } from '../components/Ticket';
import { EVENT } from '../event';

const LABELS = [
  { title: 'Fun games', art: 'top', ground: 'blue', text: 'Icebreakers, live stage battles, rapid-fire trivia and team showdowns.' },
  { title: 'Exciting events', art: 'horn', ground: 'green', text: 'The freshers spotlight, a talent showcase, and the crowning of Mr. and Ms. Freshers.' },
  { title: 'And much more', art: 'camera', ground: 'violet', text: 'A banquet, photo spots, keepsakes, and the people you will spend four years with.' },
] as const;

const STEPS = [
  ['Open the box', 'Enter your USN and the email your faculty coordinator has on file.'],
  ['Take one match', 'We email you six digits. They last five minutes.'],
  ['Strike it once', `Show the QR at counter ${EVENT.counter}. One scan, one meal, and the match is burnt.`],
];

export const HomePage: React.FC = () => {
  const poster = useRef<HTMLDialogElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const tray = useRef<HTMLDivElement>(null);

  // The tray slides out of its sleeve as it crosses the screen.
  useEffect(() => {
    const el = tray.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const place = () => {
      raf = 0;
      const b = el.getBoundingClientRect();
      const k = Math.max(0, Math.min(1, (window.innerHeight * 0.92 - b.top) / (window.innerHeight * 0.62)));
      el.style.setProperty('--out', k.toFixed(3));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(place); };
    place();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Moving over the sheet knocks the colour plates out of register.
  const knock = (e: React.PointerEvent) => {
    const el = sheet.current;
    if (!el || e.pointerType !== 'mouse') return;
    const b = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${((e.clientX - b.left) / b.width - 0.5) * 22}px`);
    el.style.setProperty('--my', `${((e.clientY - b.top) / b.height - 0.5) * 16}px`);
  };
  const settle = () => {
    sheet.current?.style.removeProperty('--mx');
    sheet.current?.style.removeProperty('--my');
  };

  return (
    <>
      <Hero />

      <section className="when">
        <Print art="n26" className="when__num" ink={{ face: 'var(--red)', tone: 'var(--key)' }} />
        <h2 className="when__text">
          <span className="sr-only">26 </span>
          <span>February</span>
          <span className="when__sm">{EVENT.weekday}, 10 in the morning to 2 in the afternoon</span>
          <span className="when__lg">{EVENT.venue}</span>
          <span className="when__sm">Department of AI &amp; DS, SGBIT Belagavi</span>
        </h2>
        <button className="when__poster" onClick={() => poster.current?.showModal()}>
          <img src="/aagazz_poster.png" alt="Open the event poster" loading="lazy" width="1043" height="1508" />
        </button>
        <Countdown />
      </section>

      <section className="sheet" ref={sheet} onPointerMove={knock} onPointerLeave={settle}>
        <div className="sheet__marks" aria-hidden="true"><i /><i /><i /><i /></div>
        <h2>What's in the box</h2>
        <div className="sheet__row">
          {LABELS.map((l) => (
            <article key={l.title} className={`label label--${l.ground}`}>
              <Frame>
                <h3 className="sr-only">{l.title}</h3>
                <Arc size={l.title.length > 12 ? 46 : 54}>{l.title}</Arc>
                <Print art={l.art} />
                <p>{l.text}</p>
              </Frame>
            </article>
          ))}
        </div>
        <div className="sheet__bar" aria-hidden="true">
          {['--yellow', '--red', '--blue', '--green', '--violet', '--key'].map((c) => <i key={c} style={{ background: `var(${c})` }} />)}
          <span>Keep in register</span>
        </div>
      </section>

      <section className="eat">
        <div className="eat__copy">
          <h2>Lunch is on the department</h2>
          <ol>
            {STEPS.map(([title, text]) => (
              <li key={title}><h3>{title}</h3><p>{text}</p></li>
            ))}
          </ol>
          <Link to="/register" className="plaque plaque--yellow">Get my food coupon</Link>
          <p className="eat__note">For AI &amp; DS students on the department list. One coupon per USN.</p>
        </div>
        <div className="mbox" ref={tray}>
          <div className="mbox__tray">
            <Ticket name="Your name here" usn="Your USN" code="Yours alone" status="Sample" kind="active">
              <Print art="thali" />
            </Ticket>
          </div>
          <div className="mbox__sleeve">
            <Print art="letteringSmall" />
            <p>Average contents: one good lunch</p>
          </div>
        </div>
      </section>

      <section className="guests">
        <Frame className="guests__label">
          <Print art="lotus" />
          <p>Chief guest</p>
          <h2>{EVENT.chiefGuest.name}</h2>
          <p>{EVENT.chiefGuest.title}</p>
        </Frame>
        <div className="guests__rest">
          <p>And our distinguished dignitaries</p>
          <ul>{EVENT.dignitaries.map((d) => <li key={d}>{d}</li>)}</ul>
        </div>
      </section>

      <dialog ref={poster} className="lightbox" onClick={() => poster.current?.close()} aria-label="Event poster">
        <img src="/aagazz_poster.png" alt="Aagazz 2K26 poster" loading="lazy" />
        <button className="plaque plaque--yellow">Close</button>
      </dialog>
    </>
  );
};
