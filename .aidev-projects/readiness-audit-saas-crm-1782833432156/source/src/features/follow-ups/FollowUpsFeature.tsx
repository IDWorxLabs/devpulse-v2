import { useMemo } from 'react';
import type { FollowUpsRecord } from './follow-ups.types';
import { listFollowUpsRecords } from './follow-ups.service';
import { FOLLOW_UPS_VALIDATION } from './follow-ups.validation';
import './follow-ups.module.css';

export default function FollowUpsFeature() {
  const records = useMemo(() => listFollowUpsRecords(), []);
  const headline = useMemo(() => 'Schedule and track follow-up tasks with contacts and leads.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="follow-ups"
      data-modular-feature-v1="true"
      data-prompt-terms="follow ups,follow-up"
    >
      <header className="modular-feature-header">
        <h2>Follow Ups</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>CRM — Follow Ups</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Follow Ups
        </button>
          <p data-validation-rules={FOLLOW_UPS_VALIDATION.rules.length}>
            Validation rules: {FOLLOW_UPS_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: FollowUpsRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
