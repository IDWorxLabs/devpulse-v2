import { useMemo } from 'react';
import type { TimeRecord } from './time.types';
import { listTimeRecords } from './time.service';
import { TIME_VALIDATION } from './time.validation';
import './time.module.css';

export default function TimeFeature() {
  const records = useMemo(() => listTimeRecords(), []);
  const headline = useMemo(() => 'Time module for modern.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="time"
      data-modular-feature-v1="true"
      data-prompt-terms="time"
    >
      <header className="modular-feature-header">
        <h2>Time</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>modern — Time</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Time
        </button>
          <p data-validation-rules={TIME_VALIDATION.rules.length}>
            Validation rules: {TIME_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: TimeRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
