import { useMemo } from 'react';
import type { CaregiverDashboardRecord } from './caregiver-dashboard.types';
import { listCaregiverDashboardRecords } from './caregiver-dashboard.service';
import { CAREGIVER_DASHBOARD_VALIDATION } from './caregiver-dashboard.validation';
import './caregiver-dashboard.module.css';

export default function CaregiverDashboardFeature() {
  const records = useMemo(() => listCaregiverDashboardRecords(), []);
  const headline = useMemo(() => 'Caregiver dashboard for monitoring communication and session status.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="caregiver-dashboard"
      data-modular-feature-v1="true"
      data-prompt-terms="caregiver dashboard"
    >
      <header className="modular-feature-header">
        <h2>Caregiver Dashboard</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>LISA — Locked In Syndrome App — Caregiver Dashboard</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Caregiver Dashboard
        </button>
          <p data-validation-rules={CAREGIVER_DASHBOARD_VALIDATION.rules.length}>
            Validation rules: {CAREGIVER_DASHBOARD_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: CaregiverDashboardRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
