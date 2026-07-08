import { useMemo } from 'react';
import type { CalendarRecord } from './calendar.types';
import { listCalendarRecords } from './calendar.service';
import { CALENDAR_VALIDATION } from './calendar.validation';
import './calendar.module.css';

export default function CalendarFeature() {
  const records = useMemo(() => listCalendarRecords(), []);
  const headline = useMemo(() => 'Calendar module for modern.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="calendar"
      data-modular-feature-v1="true"
      data-prompt-terms="calendar"
    >
      <header className="modular-feature-header">
        <h2>Calendar</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>modern — Calendar</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Calendar
        </button>
          <p data-validation-rules={CALENDAR_VALIDATION.rules.length}>
            Validation rules: {CALENDAR_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: CalendarRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
