import { useMemo } from 'react';
import type { ReservationsRecord } from './reservations.types';
import { listReservationsRecords } from './reservations.service';
import { RESERVATIONS_VALIDATION } from './reservations.validation';
import './reservations.module.css';

export default function ReservationsFeature() {
  const records = useMemo(() => listReservationsRecords(), []);
  const headline = useMemo(() => 'Reservations module for reusable components where.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="reservations"
      data-modular-feature-v1="true"
      data-prompt-terms="reservations"
    >
      <header className="modular-feature-header">
        <h2>Reservations</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>reusable components where — Reservations</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Reservations
        </button>
          <p data-validation-rules={RESERVATIONS_VALIDATION.rules.length}>
            Validation rules: {RESERVATIONS_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: ReservationsRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
