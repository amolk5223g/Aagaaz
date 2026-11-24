import React from 'react';
import { EVENT } from '../event';
import { Frame, Match, Print } from './Print';

interface TicketProps {
  name: string;
  usn: string;
  code: string;
  status: string;
  kind: 'active' | 'redeemed' | 'revoked';
  children: React.ReactNode;
}

/** The food pass: a matchbox label. One match, one meal. */
export const Ticket: React.FC<TicketProps> = ({ name, usn, code, status, kind, children }) => (
  <article className={`pass-label pass-label--${kind}`}>
    <Frame>
      <Print art="letteringSmall" className="pass-label__brand" />
      <p className="pass-label__kind">Food coupon</p>
      <div className="pass-label__mid">
        <Match state={kind === 'active' ? 'fresh' : 'burnt'} />
        <div className="pass-label__qr">{children}</div>
        <Match state={kind === 'active' ? 'fresh' : 'burnt'} />
      </div>
      <p className="pass-label__name">{name}</p>
      <dl>
        <div><dt>USN</dt><dd>{usn}</dd></div>
        <div><dt>Coupon code</dt><dd>{code}</dd></div>
      </dl>
      <p className="pass-label__terms">One match, one meal. {EVENT.weekday} {EVENT.date}, counter {EVENT.counter}.</p>
      <p className="pass-label__status">{status}</p>
    </Frame>
  </article>
);
