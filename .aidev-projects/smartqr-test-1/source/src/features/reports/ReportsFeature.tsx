import { useMemo } from 'react';
import type { ReportsRecord } from './reports.types';
import { listReportsRecords } from './reports.service';
import { REPORTS_VALIDATION } from './reports.validation';
import './reports.module.css';

export default function ReportsFeature() {
  const records = useMemo(() => listReportsRecords(), []);
  const headline = useMemo(() => 'Generate spending and income reports.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="reports"
      data-modular-feature-v1="true"
      data-prompt-terms="reports"
    >
      <header className="modular-feature-header">
        <h2>Reports</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>Expense Tracking — Reports</h3>
          <p>{headline}</p>
          <p data-validation-rules={REPORTS_VALIDATION.rules.length}>
            Validation rules: {REPORTS_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: ReportsRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
