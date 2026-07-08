import { useMemo } from 'react';
import type { DateRecord } from './date.types';
import { listDateRecords } from './date.service';
import { DATE_VALIDATION } from './date.validation';
import './date.module.css';

export default function DateFeature() {
  const records = useMemo(() => listDateRecords(), []);
  const headline = useMemo(() => 'Date module for modern.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="date"
      data-modular-feature-v1="true"
      data-prompt-terms="date"
    >
      <header className="modular-feature-header">
        <h2>Date</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>modern — Date</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Date
        </button>
          <p data-validation-rules={DATE_VALIDATION.rules.length}>
            Validation rules: {DATE_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: DateRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
