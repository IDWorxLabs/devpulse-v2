import { useMemo } from 'react';
import type { ResponsiveRecord } from './responsive.types';
import { listResponsiveRecords } from './responsive.service';
import { RESPONSIVE_VALIDATION } from './responsive.validation';
import './responsive.module.css';

export default function ResponsiveFeature() {
  const records = useMemo(() => listResponsiveRecords(), []);
  const headline = useMemo(() => 'Responsive module for modern.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="responsive"
      data-modular-feature-v1="true"
      data-prompt-terms="responsive"
    >
      <header className="modular-feature-header">
        <h2>Responsive</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>modern — Responsive</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Responsive
        </button>
          <p data-validation-rules={RESPONSIVE_VALIDATION.rules.length}>
            Validation rules: {RESPONSIVE_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: ResponsiveRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
