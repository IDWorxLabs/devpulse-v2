import { useMemo } from 'react';
import type { ModernRecord } from './modern.types';
import { listModernRecords } from './modern.service';
import { MODERN_VALIDATION } from './modern.validation';
import './modern.module.css';

export default function ModernFeature() {
  const records = useMemo(() => listModernRecords(), []);
  const headline = useMemo(() => 'Modern module for modern.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="modern"
      data-modular-feature-v1="true"
      data-prompt-terms="modern"
    >
      <header className="modular-feature-header">
        <h2>Modern</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>modern — Modern</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Modern
        </button>
          <p data-validation-rules={MODERN_VALIDATION.rules.length}>
            Validation rules: {MODERN_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: ModernRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
