import { useMemo } from 'react';
import type { LockedInRecord } from './locked-in.types';
import { listLockedInRecords } from './locked-in.service';
import { LOCKED_IN_VALIDATION } from './locked-in.validation';
import './locked-in.module.css';

export default function LockedInFeature() {
  const records = useMemo(() => listLockedInRecords(), []);
  const headline = useMemo(() => 'Locked In for LISA — Locked In Syndrome App — converts eye movement, gaze, and blinks into speech.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="locked-in"
      data-modular-feature-v1="true"
      data-prompt-terms="locked in"
    >
      <header className="modular-feature-header">
        <h2>Locked In</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>LISA — Locked In Syndrome App — Locked In</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Locked In
        </button>
          <p data-validation-rules={LOCKED_IN_VALIDATION.rules.length}>
            Validation rules: {LOCKED_IN_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: LockedInRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
