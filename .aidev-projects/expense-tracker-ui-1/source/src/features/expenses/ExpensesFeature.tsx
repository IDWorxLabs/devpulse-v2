import { useMemo } from 'react';
import type { ExpensesRecord } from './expenses.types';
import { listExpensesRecords } from './expenses.service';
import { EXPENSES_VALIDATION } from './expenses.validation';
import './expenses.module.css';

export default function ExpensesFeature() {
  const records = useMemo(() => listExpensesRecords(), []);
  const headline = useMemo(() => 'Add expenses, attach categories, and monitor spending.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="expenses"
      data-modular-feature-v1="true"
      data-prompt-terms="expenses,expense"
    >
      <header className="modular-feature-header">
        <h2>Expenses</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>modern expense tracking — Expenses</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Expenses
        </button>
          <p data-validation-rules={EXPENSES_VALIDATION.rules.length}>
            Validation rules: {EXPENSES_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: ExpensesRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
