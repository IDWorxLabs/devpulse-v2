import { useMemo } from 'react';
import type { SettingsRecord } from './settings.types';
import { listSettingsRecords } from './settings.service';
import { SETTINGS_VALIDATION } from './settings.validation';
import './settings.module.css';

export default function SettingsFeature() {
  const records = useMemo(() => listSettingsRecords(), []);
  const headline = useMemo(() => 'Settings for Custom App — deliver prompt-specific capabilities.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="settings"
      data-modular-feature-v1="true"
      data-prompt-terms="settings"
    >
      <header className="modular-feature-header">
        <h2>Settings</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>Custom App — Settings</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Settings
        </button>
          <p data-validation-rules={SETTINGS_VALIDATION.rules.length}>
            Validation rules: {SETTINGS_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: SettingsRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
