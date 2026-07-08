import { useMemo } from 'react';
import type { OnboardingRecord } from './onboarding.types';
import { listOnboardingRecords } from './onboarding.service';
import { ONBOARDING_VALIDATION } from './onboarding.validation';
import './onboarding.module.css';

export default function OnboardingFeature() {
  const records = useMemo(() => listOnboardingRecords(), []);
  const headline = useMemo(() => 'Onboarding module for CRM.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="onboarding"
      data-modular-feature-v1="true"
      data-prompt-terms="onboarding"
    >
      <header className="modular-feature-header">
        <h2>Onboarding</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>CRM — Onboarding</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Onboarding
        </button>
          <p data-validation-rules={ONBOARDING_VALIDATION.rules.length}>
            Validation rules: {ONBOARDING_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: OnboardingRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
