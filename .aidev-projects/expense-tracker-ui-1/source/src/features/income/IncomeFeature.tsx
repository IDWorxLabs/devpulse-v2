import { useMemo } from 'react';
import type { IncomeRecord } from './income.types';
import { listIncomeRecords } from './income.service';
import { INCOME_VALIDATION } from './income.validation';
import './income.module.css';

export default function IncomeFeature() {
  const records = useMemo(() => listIncomeRecords(), []);
  const headline = useMemo(() => 'Record income entries and review incoming cash flow.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="income"
      data-modular-feature-v1="true"
      data-prompt-terms="income"
    >
      <header className="modular-feature-header">
        <h2>Income</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>modern expense tracking — Income</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Income
        </button>
          <p data-validation-rules={INCOME_VALIDATION.rules.length}>
            Validation rules: {INCOME_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: IncomeRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
