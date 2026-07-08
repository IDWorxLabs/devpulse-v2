import { useMemo } from 'react';
import type { WashRecord } from './wash.types';
import { listWashRecords } from './wash.service';
import { WASH_VALIDATION } from './wash.validation';
import './wash.module.css';

export default function WashFeature() {
  const records = useMemo(() => listWashRecords(), []);
  const headline = useMemo(() => 'Wash module for modern.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="wash"
      data-modular-feature-v1="true"
      data-prompt-terms="wash"
    >
      <header className="modular-feature-header">
        <h2>Wash</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>modern — Wash</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Wash
        </button>
          <p data-validation-rules={WASH_VALIDATION.rules.length}>
            Validation rules: {WASH_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: WashRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
