import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { EVENT } from '../event';
import { Flame, Match, Print } from './Print';
import { useMusic } from './MusicProvider';

interface Spark { x: number; y: number; vx: number; vy: number; life: number; hue: string }

const INKS = ['#f6c915', '#f6c915', '#fff6d8', '#e0301e'];

/** Jagged burst with an even-odd hole, so the dark lifts like a torn star. */
function burst(w: number, h: number, x: number, y: number, r: number) {
  const points: string[] = [];
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * Math.PI * 2;
    const k = i % 2 ? r * 0.8 : r * (1 + ((i * 37) % 11) / 60);
    points.push(`${(x + Math.cos(a) * k).toFixed(0)} ${(y + Math.sin(a) * k).toFixed(0)}`);
  }
  return `path(evenodd, "M0 0H${w}V${h}H0Z M${points.join('L')}Z")`;
}

export const Hero: React.FC = () => {
  const { getBass, start, stop, isPlaying } = useMusic();
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [lit, setLit] = useState(still);
  const [spent, setSpent] = useState(false);
  const litRef = useRef(lit);
  const host = useRef<HTMLElement>(null);
  const night = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const stick = useRef<HTMLButtonElement>(null);
  const wick = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const sparks = useRef<Spark[]>([]);
  const raf = useRef(0);
  const paint = useRef<() => void>(() => {});

  useEffect(() => {
    paint.current = () => {
    const c = canvas.current, box = host.current;
    if (!c || !box) return;
    const ctx = c.getContext('2d')!;
    if (c.width !== box.clientWidth || c.height !== box.clientHeight) {
      c.width = box.clientWidth;
      c.height = box.clientHeight;
    }
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.lineCap = 'round';
    sparks.current = sparks.current.filter((s) => s.life > 0);
    for (const s of sparks.current) {
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.42;
      s.life -= 0.028;
      ctx.strokeStyle = s.hue;
      ctx.lineWidth = 1.5 + s.life * 3;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 2.2, s.y - s.vy * 2.2);
      ctx.stroke();
    }
    raf.current = sparks.current.length ? requestAnimationFrame(paint.current) : 0;
    };
    return () => {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, []);

  const spray = useCallback((x: number, y: number, n: number, dir: number, power: number) => {
    if (still) return;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + dir * 0.7 + (Math.random() - 0.5) * 1.9;
      const v = power * (0.35 + Math.random());
      sparks.current.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.5, hue: INKS[(Math.random() * INKS.length) | 0] });
    }
    if (!raf.current) raf.current = requestAnimationFrame(paint.current);
  }, [still]);

  /** Point in hero coordinates where the loose match head touches the strip. */
  const tip = useCallback(() => {
    const h = host.current!.getBoundingClientRect(), s = stick.current!.getBoundingClientRect();
    return { x: s.left - h.left + s.width * 0.1, y: s.bottom - h.top - 8 };
  }, []);

  const ignite = useCallback(() => {
    if (litRef.current) return;
    litRef.current = true;
    const t = tip();
    spray(t.x, t.y, 70, 0.4, 13);
    const box = host.current!, n = night.current!, h = box.getBoundingClientRect(), f = wick.current!.getBoundingClientRect();
    const x = f.left - h.left + f.width / 2, y = f.top - h.top + f.height * 0.7;
    if (!still) n.style.clipPath = burst(h.width, h.height, x, y, 1);
    setSpent(true);
    setLit(true);
    if (still) return;
    const max = Math.hypot(Math.max(x, h.width - x), Math.max(y, h.height - y)) * 1.3;
    const begun = performance.now();
    const open = (now: number) => {
      // Stepped at 24 frames so it reads as animation, not a web transition.
      const k = Math.floor(Math.min(1, (now - begun) / 750) * 18) / 18;
      n.style.clipPath = burst(h.width, h.height, x, y, max * k * k * (1.6 - 0.6 * k));
      if (k < 1) requestAnimationFrame(open);
      else n.style.clipPath = '';
    };
    requestAnimationFrame(open);
  }, [spray, still, tip]);

  const blowOut = () => {
    litRef.current = false;
    setLit(false);
    setSpent(false);
    if (stick.current) stick.current.style.transform = '';
    stop();
  };

  /** Drags the match along the strip by itself. Used by the button and, if nobody strikes, after a pause. */
  const autoStrike = useCallback((withMusic: boolean) => {
    const el = stick.current, st = strip.current;
    if (!el || !st || litRef.current) return;
    if (withMusic) start();
    if (still) { ignite(); return; }
    const run = Math.min(420, st.clientWidth * 0.42);
    const anim = el.animate(
      [{ transform: 'none' }, { transform: 'translate(-14px, -6px)', offset: 0.35 }, { transform: `translate(${run}px, 0)` }],
      { duration: 620, easing: 'cubic-bezier(.5,0,.3,1)' },
    );
    const id = window.setInterval(() => {
      const t = tip();
      if ((anim.effect?.getComputedTiming().progress ?? 0) > 0.4) spray(t.x, t.y, 5, 0.9, 7);
    }, 32);
    anim.onfinish = () => {
      window.clearInterval(id);
      el.style.transform = `translate(${run}px, 0)`;
      ignite();
    };
  }, [ignite, spray, start, still, tip]);

  useEffect(() => {
    if (still) return;
    const id = window.setTimeout(() => autoStrike(false), 3200);
    return () => window.clearTimeout(id);
  }, [autoStrike, still]);

  // The flame leans into the beat while the anthem plays.
  useEffect(() => {
    if (!lit || !isPlaying || still) return;
    const id = window.setInterval(() => {
      host.current?.style.setProperty('--beat', (1 + getBass() * 0.55).toFixed(2));
    }, 83);
    const box = host.current;
    return () => {
      window.clearInterval(id);
      box?.style.removeProperty('--beat');
    };
  }, [lit, isPlaying, getBass, still]);

  const drag = useRef<{ x: number; lastX: number; lastT: number; rub: number; moved: boolean } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    if (lit) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, lastX: e.clientX, lastT: e.timeStamp, rub: 0, moved: false };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current, el = stick.current, st = strip.current;
    if (!d || !el || !st || litRef.current) return;
    const dx = e.clientX - d.lastX, speed = Math.abs(dx) / Math.max(1, e.timeStamp - d.lastT);
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    const off = Math.max(-el.offsetLeft, Math.min(st.clientWidth - el.offsetLeft - 60, e.clientX - d.x));
    el.style.transform = `translate(${off}px, 0)`;
    if (Math.abs(e.clientX - d.x) > 6) d.moved = true;
    if (speed > 0.45) {
      d.rub += Math.abs(dx);
      const t = tip();
      spray(t.x, t.y, 2 + Math.min(6, speed * 3), Math.sign(dx), 5 + speed * 2);
      if (d.rub > 130) {
        drag.current = null;
        start();
        ignite();
      }
    } else d.rub *= 0.9;
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) autoStrike(true);
  };

  return (
    <section className={`hero ${lit ? 'is-lit' : ''}`} ref={host}>
      <div className="hero__label">
        <p className="hero__maker">Department of AI &amp; DS, S. G. Balekundri Institute of Technology, Belagavi</p>
        <h1 className="sr-only">Aagazz 2K26, the AI and DS freshers' party</h1>
        <Print art="lettering" className="hero__letters" />
        <div className="hero__emblem">
          <Print art="emblem" />
          <span className="hero__wick" ref={wick}><Flame /></span>
        </div>
        <Print art="k26" className="hero__year" ink={{ face: 'var(--red)' }} />
      </div>

      <div className={`night ${lit ? 'is-open' : ''}`} ref={night} aria-hidden="true" />

      <div className="hero__side hero__side--l">
        <p className="hero__line">Where minds connect and futures begin</p>
        <p>The freshers' party for batch <span className="nobr">{EVENT.batch}</span>.</p>
        <Link to="/register" className="plaque plaque--yellow">Get my food coupon</Link>
      </div>
      <div className="hero__side hero__side--r">
        <p className="hero__line">{EVENT.weekday}<br />{EVENT.date}</p>
        <p>{EVENT.time}<br />{EVENT.venue}</p>
        {lit ? (
          <button className="plaque plaque--line" onClick={blowOut}>Blow it out</button>
        ) : (
          <button className="plaque plaque--line" onClick={() => autoStrike(true)} data-music>Strike the match</button>
        )}
      </div>

      <div className="striker" ref={strip}>
        <button
          ref={stick}
          className={`striker__match ${spent ? 'is-spent' : ''}`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && autoStrike(true)}
          aria-label="Strike the match along the strip"
          disabled={lit}
          data-music
        >
          <Match state={spent ? 'burnt' : 'fresh'} />
        </button>
        <p className="striker__hint">{lit ? 'Safety party. Contents: four hours, zero lectures.' : 'Drag the match along the strip'}</p>
      </div>
      <canvas className="hero__sparks" ref={canvas} aria-hidden="true" />
    </section>
  );
};
