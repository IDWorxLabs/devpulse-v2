import { useMemo } from 'react';
import type { HabitsRecord } from './habits.types';
import { listHabitsRecords } from './habits.service';
import { HABITS_VALIDATION } from './habits.validation';
import './habits.module.css';

export default function HabitsFeature() {
  const records = useMemo(() => listHabitsRecords(), []);
  const headline = useMemo(() => 'Track daily habits and completion check-ins.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="habits"
      data-modular-feature-v1="true"
      data-prompt-terms="habits,habit"
    >
      <header className="modular-feature-header">
        <h2>Habits</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>modern — Habits</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Habits
        </button>
          <p data-validation-rules={HABITS_VALIDATION.rules.length}>
            Validation rules: {HABITS_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: HabitsRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
