import { useMemo } from 'react';
import type { RevenueRecord } from './revenue.types';
import { listRevenueRecords } from './revenue.service';
import { REVENUE_VALIDATION } from './revenue.validation';
import './revenue.module.css';

export default function RevenueFeature() {
  const records = useMemo(() => listRevenueRecords(), []);
  const headline = useMemo(() => 'Revenue module for reusable components where.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="revenue"
      data-modular-feature-v1="true"
      data-prompt-terms="revenue"
    >
      <header className="modular-feature-header">
        <h2>Revenue</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>reusable components where — Revenue</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Revenue
        </button>
          <p data-validation-rules={REVENUE_VALIDATION.rules.length}>
            Validation rules: {REVENUE_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: RevenueRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
