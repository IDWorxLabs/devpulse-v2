import { useMemo } from 'react';
import type { StylingRecord } from './styling.types';
import { listStylingRecords } from './styling.service';
import { STYLING_VALIDATION } from './styling.validation';
import './styling.module.css';

export default function StylingFeature() {
  const records = useMemo(() => listStylingRecords(), []);
  const headline = useMemo(() => 'Styling module for modern.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="styling"
      data-modular-feature-v1="true"
      data-prompt-terms="styling"
    >
      <header className="modular-feature-header">
        <h2>Styling</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>modern — Styling</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Styling
        </button>
          <p data-validation-rules={STYLING_VALIDATION.rules.length}>
            Validation rules: {STYLING_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: StylingRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
