import { useMemo } from 'react';
import type { ServicesRecord } from './services.types';
import { listServicesRecords } from './services.service';
import { SERVICES_VALIDATION } from './services.validation';
import './services.module.css';

export default function ServicesFeature() {
  const records = useMemo(() => listServicesRecords(), []);
  const headline = useMemo(() => 'Services module for modern.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="services"
      data-modular-feature-v1="true"
      data-prompt-terms="services"
    >
      <header className="modular-feature-header">
        <h2>Services</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>modern — Services</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Services
        </button>
          <p data-validation-rules={SERVICES_VALIDATION.rules.length}>
            Validation rules: {SERVICES_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: ServicesRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
