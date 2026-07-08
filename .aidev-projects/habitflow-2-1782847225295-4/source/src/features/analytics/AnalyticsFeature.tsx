import { useMemo } from 'react';
import type { AnalyticsRecord } from './analytics.types';
import { listAnalyticsRecords } from './analytics.service';
import { ANALYTICS_VALIDATION } from './analytics.validation';
import './analytics.module.css';

export default function AnalyticsFeature() {
  const records = useMemo(() => listAnalyticsRecords(), []);
  const headline = useMemo(() => 'Weekly habit analytics and completion trends.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="analytics"
      data-modular-feature-v1="true"
      data-prompt-terms="analytics"
    >
      <header className="modular-feature-header">
        <h2>Analytics</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>modern — Analytics</h3>
          <p>{headline}</p>
          <p data-validation-rules={ANALYTICS_VALIDATION.rules.length}>
            Validation rules: {ANALYTICS_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: AnalyticsRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
