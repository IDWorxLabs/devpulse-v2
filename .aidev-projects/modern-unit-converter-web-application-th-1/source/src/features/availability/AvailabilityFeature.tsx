import { useMemo } from 'react';
import type { AvailabilityRecord } from './availability.types';
import { listAvailabilityRecords } from './availability.service';
import { AVAILABILITY_VALIDATION } from './availability.validation';
import './availability.module.css';

export default function AvailabilityFeature() {
  const records = useMemo(() => listAvailabilityRecords(), []);
  const headline = useMemo(() => 'Availability module for reusable components where.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="availability"
      data-modular-feature-v1="true"
      data-prompt-terms="availability"
    >
      <header className="modular-feature-header">
        <h2>Availability</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>reusable components where — Availability</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Availability
        </button>
          <p data-validation-rules={AVAILABILITY_VALIDATION.rules.length}>
            Validation rules: {AVAILABILITY_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: AvailabilityRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
