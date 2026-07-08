import { useMemo } from 'react';
import type { GoalsRecord } from './goals.types';
import { listGoalsRecords } from './goals.service';
import { GOALS_VALIDATION } from './goals.validation';
import './goals.module.css';

export default function GoalsFeature() {
  const records = useMemo(() => listGoalsRecords(), []);
  const headline = useMemo(() => 'Set and track habit goals and milestones.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="goals"
      data-modular-feature-v1="true"
      data-prompt-terms="goals"
    >
      <header className="modular-feature-header">
        <h2>Goals</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>modern — Goals</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Goals
        </button>
          <p data-validation-rules={GOALS_VALIDATION.rules.length}>
            Validation rules: {GOALS_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: GoalsRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
