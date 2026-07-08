import { useMemo } from 'react';
import type { StreaksRecord } from './streaks.types';
import { listStreaksRecords } from './streaks.service';
import { STREAKS_VALIDATION } from './streaks.validation';
import './streaks.module.css';

export default function StreaksFeature() {
  const records = useMemo(() => listStreaksRecords(), []);
  const headline = useMemo(() => 'View streak counts and consistency trends.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="streaks"
      data-modular-feature-v1="true"
      data-prompt-terms="streaks,streak"
    >
      <header className="modular-feature-header">
        <h2>Streaks</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>modern — Streaks</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Streaks
        </button>
          <p data-validation-rules={STREAKS_VALIDATION.rules.length}>
            Validation rules: {STREAKS_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: StreaksRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
