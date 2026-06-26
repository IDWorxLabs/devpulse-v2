import { useMemo } from 'react';
import type { TasksRecord } from './tasks.types';
import { listTasksRecords } from './tasks.service';
import { TASKS_VALIDATION } from './tasks.validation';
import './tasks.module.css';

export default function TasksFeature() {
  const records = useMemo(() => listTasksRecords(), []);
  const headline = useMemo(() => 'Tasks module for Lisa As A Real Modular.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="tasks"
      data-modular-feature-v1="true"
      data-prompt-terms="tasks,task"
    >
      <header className="modular-feature-header">
        <h2>Tasks</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>Lisa As A Real Modular — Tasks</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Tasks
        </button>
          <p data-validation-rules={TASKS_VALIDATION.rules.length}>
            Validation rules: {TASKS_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: TasksRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
