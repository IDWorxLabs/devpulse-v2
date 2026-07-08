import { useMemo } from 'react';
import type { AppointmentsRecord } from './appointments.types';
import { listAppointmentsRecords } from './appointments.service';
import { APPOINTMENTS_VALIDATION } from './appointments.validation';
import './appointments.module.css';

export default function AppointmentsFeature() {
  const records = useMemo(() => listAppointmentsRecords(), []);
  const headline = useMemo(() => 'Appointments module for modern.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="appointments"
      data-modular-feature-v1="true"
      data-prompt-terms="appointments"
    >
      <header className="modular-feature-header">
        <h2>Appointments</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>modern — Appointments</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Appointments
        </button>
          <p data-validation-rules={APPOINTMENTS_VALIDATION.rules.length}>
            Validation rules: {APPOINTMENTS_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: AppointmentsRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
