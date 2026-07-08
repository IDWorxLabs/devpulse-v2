import { useMemo } from 'react';
import type { DashboardRecord } from './dashboard.types';
import { listDashboardRecords } from './dashboard.service';
import { DASHBOARD_VALIDATION } from './dashboard.validation';
import './dashboard.module.css';

export default function DashboardFeature() {
  const records = useMemo(() => listDashboardRecords(), []);
  const headline = useMemo(() => 'Balance overview with income vs expenses cards and monthly budget progress.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="dashboard"
      data-modular-feature-v1="true"
      data-prompt-terms="dashboard"
    >
      <header className="modular-feature-header">
        <h2>Dashboard</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>Expense Tracker — Dashboard</h3>
          <p>{headline}</p>
          <p data-validation-rules={DASHBOARD_VALIDATION.rules.length}>
            Validation rules: {DASHBOARD_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: DashboardRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
