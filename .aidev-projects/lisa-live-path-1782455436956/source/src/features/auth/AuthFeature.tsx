import { useMemo } from 'react';
import type { AuthRecord } from './auth.types';
import { listAuthRecords } from './auth.service';
import { AUTH_VALIDATION } from './auth.validation';
import './auth.module.css';

export default function AuthFeature() {
  const records = useMemo(() => listAuthRecords(), []);
  const headline = useMemo(() => 'Secure access for caregivers and assistive communication users and mobile users.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="auth"
      data-modular-feature-v1="true"
      data-prompt-terms="auth"
    >
      <header className="modular-feature-header">
        <h2>Auth</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>LISA — Locked In Syndrome App — Auth</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Auth
        </button>
          <p data-validation-rules={AUTH_VALIDATION.rules.length}>
            Validation rules: {AUTH_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: AuthRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
