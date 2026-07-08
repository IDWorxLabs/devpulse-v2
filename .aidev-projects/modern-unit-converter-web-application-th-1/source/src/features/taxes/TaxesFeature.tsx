import { useMemo } from 'react';
import type { TaxesRecord } from './taxes.types';
import { listTaxesRecords } from './taxes.service';
import { TAXES_VALIDATION } from './taxes.validation';
import './taxes.module.css';

export default function TaxesFeature() {
  const records = useMemo(() => listTaxesRecords(), []);
  const headline = useMemo(() => 'Taxes module for reusable components where.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="taxes"
      data-modular-feature-v1="true"
      data-prompt-terms="taxes"
    >
      <header className="modular-feature-header">
        <h2>Taxes</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>reusable components where — Taxes</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Taxes
        </button>
          <p data-validation-rules={TAXES_VALIDATION.rules.length}>
            Validation rules: {TAXES_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: TaxesRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
