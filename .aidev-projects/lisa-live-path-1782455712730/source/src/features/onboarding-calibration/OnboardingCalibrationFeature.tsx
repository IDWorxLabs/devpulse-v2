import { useMemo } from 'react';
import type { OnboardingCalibrationRecord } from './onboarding-calibration.types';
import { listOnboardingCalibrationRecords } from './onboarding-calibration.service';
import { ONBOARDING_CALIBRATION_VALIDATION } from './onboarding-calibration.validation';
import './onboarding-calibration.module.css';

export default function OnboardingCalibrationFeature() {
  const records = useMemo(() => listOnboardingCalibrationRecords(), []);
  const headline = useMemo(() => 'Calibrate eye tracking, gaze zones, and blink sensitivity for accurate input.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="onboarding-calibration"
      data-modular-feature-v1="true"
      data-prompt-terms="onboarding calibration"
    >
      <header className="modular-feature-header">
        <h2>Onboarding Calibration</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>LISA — Locked In Syndrome App — Onboarding Calibration</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Onboarding Calibration
        </button>
          <p data-validation-rules={ONBOARDING_CALIBRATION_VALIDATION.rules.length}>
            Validation rules: {ONBOARDING_CALIBRATION_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: OnboardingCalibrationRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
