import { useMemo } from 'react';
import type { TimelineRecord } from './timeline.types';
import { listTimelineRecords } from './timeline.service';
import { TIMELINE_VALIDATION } from './timeline.validation';
import './timeline.module.css';

export default function TimelineFeature() {
  const records = useMemo(() => listTimelineRecords(), []);
  const headline = useMemo(() => 'Timeline module for Lisa As A Real Modular.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="timeline"
      data-modular-feature-v1="true"
      data-prompt-terms="timeline"
    >
      <header className="modular-feature-header">
        <h2>Timeline</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>Lisa As A Real Modular — Timeline</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Timeline
        </button>
          <p data-validation-rules={TIMELINE_VALIDATION.rules.length}>
            Validation rules: {TIMELINE_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: TimelineRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
