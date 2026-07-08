import { useMemo } from 'react';
import type { TimeOffRecord } from './time-off.types';
import { listTimeOffRecords } from './time-off.service';
import { TIME_OFF_VALIDATION } from './time-off.validation';
import './time-off.module.css';

export default function TimeOffFeature() {
  const records = useMemo(() => listTimeOffRecords(), []);
  const headline = useMemo(() => 'Time Off module for CRM.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="time-off"
      data-modular-feature-v1="true"
      data-prompt-terms="time off"
    >
      <header className="modular-feature-header">
        <h2>Time Off</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>CRM — Time Off</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Time Off
        </button>
          <p data-validation-rules={TIME_OFF_VALIDATION.rules.length}>
            Validation rules: {TIME_OFF_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: TimeOffRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
