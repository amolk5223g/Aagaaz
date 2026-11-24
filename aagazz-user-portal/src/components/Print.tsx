import React from 'react';
import { ART } from '../lib/art';
import type { ArtName } from '../lib/art';

/** Which press run each plate belongs to. Runs shift together when out of register. */
const RUN: Record<string, 'y' | 'r' | 'k'> = {
  sun: 'y', face: 'y', band: 'y', flameMid: 'y', food1: 'y', wood: 'y',
  rays: 'r', tone: 'r', body: 'r', head: 'r', flameOuter: 'r', food2: 'r', cuff: 'r', food3: 'r',
};

interface PrintProps {
  art: ArtName;
  className?: string;
  /** Plate colour overrides, for example { face: 'var(--red)' }. */
  ink?: Record<string, string>;
  title?: string;
}

export const Print: React.FC<PrintProps> = ({ art, className = '', ink, title }) => {
  const { vb, p } = ART[art];
  return (
    <svg
      viewBox={vb}
      className={`print print--${art} ${className}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {Object.entries(p).map(([plate, shape]) => (
        <g
          key={plate}
          className={`run-${RUN[plate] ?? 'k'} ink-${plate}`}
          style={ink?.[plate] ? { color: ink[plate] } : undefined}
        >
          {typeof shape === 'string' ? (
            <path d={shape} fill="currentColor" fillRule="evenodd" />
          ) : (
            shape.map(([w, dots]) => (
              <path key={w} d={dots} stroke="currentColor" strokeWidth={w} strokeLinecap="round" fill="none" />
            ))
          )}
        </g>
      ))}
    </svg>
  );
};

/** Printed frame with corner ornaments, as on a matchbox label. */
export const Frame: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`frame ${className}`}>
    {['tl', 'tr', 'bl', 'br'].map((c) => <Print key={c} art="corner" className={`frame__corner frame__corner--${c}`} />)}
    {children}
  </div>
);

let arcId = 0;

/** A line of type set on an arch with a hard block shadow. */
export const Arc: React.FC<{ children: string; size?: number; rise?: number }> = ({ children, size = 58, rise = 46 }) => {
  const [id] = React.useState(() => `arc${arcId++}`);
  return (
    <svg className="arc" viewBox={`0 0 400 ${rise + size + 8}`} aria-hidden="true">
      <path id={id} d={`M6 ${rise + size - 6} Q200 ${size - rise - 6} 394 ${rise + size - 6}`} fill="none" />
      {[4, 0].map((o) => (
        <text key={o} className={o ? 'arc__shadow' : 'arc__face'} fontSize={size} transform={`translate(${o} ${o})`}>
          <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">{children}</textPath>
        </text>
      ))}
    </svg>
  );
};

/** Four drawn flame frames played on twos. */
export const Flame: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`flame ${className}`} aria-hidden="true">
    {(['flame0', 'flame1', 'flame2', 'flame3'] as const).map((f) => <Print key={f} art={f} />)}
  </span>
);

export type MatchState = 'fresh' | 'lit' | 'burnt';

export const Match: React.FC<{ state: MatchState; className?: string }> = ({ state, className = '' }) => (
  <span className={`match match--${state} ${className}`} aria-hidden="true">
    <Print art={state === 'burnt' ? 'matchBurnt' : 'match'} ink={state === 'burnt' ? { head: 'var(--key)', shine: '#6a6572' } : undefined} />
    {state === 'lit' && <Flame />}
  </span>
);
