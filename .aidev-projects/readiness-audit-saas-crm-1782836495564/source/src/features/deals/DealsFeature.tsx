import { useMemo } from 'react';
import type { DealsRecord } from './deals.types';
import { listDealsRecords } from './deals.service';
import { DEALS_VALIDATION } from './deals.validation';
import './deals.module.css';

export default function DealsFeature() {
  const records = useMemo(() => listDealsRecords(), []);
  const headline = useMemo(() => 'Review deal value, stage, and close dates.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="deals"
      data-modular-feature-v1="true"
      data-prompt-terms="deals,deal"
    >
      <header className="modular-feature-header">
        <h2>Deals</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>CRM — Deals</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Deals
        </button>
          <p data-validation-rules={DEALS_VALIDATION.rules.length}>
            Validation rules: {DEALS_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: DealsRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
