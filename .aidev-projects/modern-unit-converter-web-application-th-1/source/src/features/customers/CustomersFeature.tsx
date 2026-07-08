import { useMemo } from 'react';
import type { CustomersRecord } from './customers.types';
import { listCustomersRecords } from './customers.service';
import { CUSTOMERS_VALIDATION } from './customers.validation';
import './customers.module.css';

export default function CustomersFeature() {
  const records = useMemo(() => listCustomersRecords(), []);
  const headline = useMemo(() => 'Customers module for reusable components where.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="customers"
      data-modular-feature-v1="true"
      data-prompt-terms="customers"
    >
      <header className="modular-feature-header">
        <h2>Customers</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>reusable components where — Customers</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Customers
        </button>
          <p data-validation-rules={CUSTOMERS_VALIDATION.rules.length}>
            Validation rules: {CUSTOMERS_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: CustomersRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
