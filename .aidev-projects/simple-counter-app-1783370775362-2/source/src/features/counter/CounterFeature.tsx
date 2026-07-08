import { useMemo } from 'react';
import type { CounterRecord } from './counter.types';
import { listCounterRecords } from './counter.service';
import { COUNTER_VALIDATION } from './counter.validation';
import './counter.module.css';

export default function CounterFeature() {
  const records = useMemo(() => listCounterRecords(), []);
  const headline = useMemo(() => 'Counter for simple counter — a simple counter app with increment and decrement buttons and a reset button, take two.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="counter"
      data-modular-feature-v1="true"
      data-prompt-terms="counter"
    >
      <header className="modular-feature-header">
        <h2>Counter</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>simple counter — Counter</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Counter
        </button>
          <p data-validation-rules={COUNTER_VALIDATION.rules.length}>
            Validation rules: {COUNTER_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: CounterRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
