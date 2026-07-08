import { useMemo } from 'react';
import type { ActivitiesRecord } from './activities.types';
import { listActivitiesRecords } from './activities.service';
import { ACTIVITIES_VALIDATION } from './activities.validation';
import './activities.module.css';

export default function ActivitiesFeature() {
  const records = useMemo(() => listActivitiesRecords(), []);
  const headline = useMemo(() => 'Activities module for Custom App.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="activities"
      data-modular-feature-v1="true"
      data-prompt-terms="activities"
    >
      <header className="modular-feature-header">
        <h2>Activities</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>Custom App — Activities</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Activities
        </button>
          <p data-validation-rules={ACTIVITIES_VALIDATION.rules.length}>
            Validation rules: {ACTIVITIES_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: ActivitiesRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
