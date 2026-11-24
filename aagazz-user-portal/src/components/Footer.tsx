import React from 'react';
import { EVENT } from '../event';

export const Footer: React.FC = () => (
  <footer className="foot">
    <div className="foot__panel">
      <p className="foot__word" lang="hi" aria-label="Aagaaz, a beginning">आग़ाज़</p>
      <div className="foot__cols">
        <div>
          <h2>Student coordinators</h2>
          <ul>{EVENT.coordinators.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
        <div>
          <h2>The party</h2>
          <ul>
            <li>{EVENT.weekday} {EVENT.date}</li>
            <li>{EVENT.time}</li>
            <li>{EVENT.venue}, AI &amp; DS department</li>
          </ul>
        </div>
        <div>
          <h2>Made in Belagavi by</h2>
          <p>
            {EVENT.department}, S. S. Education Trust's S. G. Balekundri Institute of Technology,
            Shivabasava Nagar, Belagavi 590010, Karnataka.
          </p>
        </div>
      </div>
    </div>
  </footer>
);
