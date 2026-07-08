import { useMemo } from 'react';
import type { ServiceRecord } from './service.types';
import { listServiceRecords } from './service.service';
import { SERVICE_VALIDATION } from './service.validation';
import './service.module.css';

export default function ServiceFeature() {
  const records = useMemo(() => listServiceRecords(), []);
  const headline = useMemo(() => 'Service module for modern.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="service"
      data-modular-feature-v1="true"
      data-prompt-terms="service"
    >
      <header className="modular-feature-header">
        <h2>Service</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>modern — Service</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Service
        </button>
          <p data-validation-rules={SERVICE_VALIDATION.rules.length}>
            Validation rules: {SERVICE_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: ServiceRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
