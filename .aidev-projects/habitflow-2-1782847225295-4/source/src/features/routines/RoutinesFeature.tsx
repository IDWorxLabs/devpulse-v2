import { useMemo } from 'react';
import type { RoutinesRecord } from './routines.types';
import { listRoutinesRecords } from './routines.service';
import { ROUTINES_VALIDATION } from './routines.validation';
import './routines.module.css';

export default function RoutinesFeature() {
  const records = useMemo(() => listRoutinesRecords(), []);
  const headline = useMemo(() => 'Plan morning and evening routines.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="routines"
      data-modular-feature-v1="true"
      data-prompt-terms="routines"
    >
      <header className="modular-feature-header">
        <h2>Routines</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>modern — Routines</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Routines
        </button>
          <p data-validation-rules={ROUTINES_VALIDATION.rules.length}>
            Validation rules: {ROUTINES_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: RoutinesRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
