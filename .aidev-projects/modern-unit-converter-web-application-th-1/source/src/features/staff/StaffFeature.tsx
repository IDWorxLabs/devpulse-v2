import { useMemo } from 'react';
import type { StaffRecord } from './staff.types';
import { listStaffRecords } from './staff.service';
import { STAFF_VALIDATION } from './staff.validation';
import './staff.module.css';

export default function StaffFeature() {
  const records = useMemo(() => listStaffRecords(), []);
  const headline = useMemo(() => 'Staff module for reusable components where.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="staff"
      data-modular-feature-v1="true"
      data-prompt-terms="staff"
    >
      <header className="modular-feature-header">
        <h2>Staff</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>reusable components where — Staff</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Staff
        </button>
          <p data-validation-rules={STAFF_VALIDATION.rules.length}>
            Validation rules: {STAFF_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: StaffRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
