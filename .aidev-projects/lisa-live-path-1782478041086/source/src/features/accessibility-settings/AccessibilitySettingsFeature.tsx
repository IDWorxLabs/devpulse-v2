import { useMemo } from 'react';
import type { AccessibilitySettingsRecord } from './accessibility-settings.types';
import { listAccessibilitySettingsRecords } from './accessibility-settings.service';
import { ACCESSIBILITY_SETTINGS_VALIDATION } from './accessibility-settings.validation';
import './accessibility-settings.module.css';

export default function AccessibilitySettingsFeature() {
  const records = useMemo(() => listAccessibilitySettingsRecords(), []);
  const headline = useMemo(() => 'Accessibility settings for contrast, tile size, and input sensitivity.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="accessibility-settings"
      data-modular-feature-v1="true"
      data-prompt-terms="accessibility settings"
    >
      <header className="modular-feature-header">
        <h2>Accessibility Settings</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>LISA — Locked In Syndrome App — Accessibility Settings</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Accessibility Settings
        </button>
          <p data-validation-rules={ACCESSIBILITY_SETTINGS_VALIDATION.rules.length}>
            Validation rules: {ACCESSIBILITY_SETTINGS_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: AccessibilitySettingsRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
