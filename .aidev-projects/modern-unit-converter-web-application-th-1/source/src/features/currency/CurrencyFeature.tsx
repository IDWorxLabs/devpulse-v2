import { useMemo } from 'react';
import type { CurrencyRecord } from './currency.types';
import { listCurrencyRecords } from './currency.service';
import { CURRENCY_VALIDATION } from './currency.validation';
import './currency.module.css';

export default function CurrencyFeature() {
  const records = useMemo(() => listCurrencyRecords(), []);
  const headline = useMemo(() => 'Currency module for reusable components where.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="currency"
      data-modular-feature-v1="true"
      data-prompt-terms="currency"
    >
      <header className="modular-feature-header">
        <h2>Currency</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>reusable components where — Currency</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Currency
        </button>
          <p data-validation-rules={CURRENCY_VALIDATION.rules.length}>
            Validation rules: {CURRENCY_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: CurrencyRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
