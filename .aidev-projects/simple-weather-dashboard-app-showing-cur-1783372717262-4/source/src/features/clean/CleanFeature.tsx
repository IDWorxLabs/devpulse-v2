import { useMemo } from 'react';
import type { CleanRecord } from './clean.types';
import { listCleanRecords } from './clean.service';
import { CLEAN_VALIDATION } from './clean.validation';
import './clean.module.css';

export default function CleanFeature() {
  const records = useMemo(() => listCleanRecords(), []);
  const headline = useMemo(() => 'Clean module for modern.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="clean"
      data-modular-feature-v1="true"
      data-prompt-terms="clean"
    >
      <header className="modular-feature-header">
        <h2>Clean</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>modern — Clean</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Clean
        </button>
          <p data-validation-rules={CLEAN_VALIDATION.rules.length}>
            Validation rules: {CLEAN_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: CleanRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
