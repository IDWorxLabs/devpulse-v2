import { useMemo } from 'react';
import type { CustomerRecord } from './customer.types';
import { listCustomerRecords } from './customer.service';
import { CUSTOMER_VALIDATION } from './customer.validation';
import './customer.module.css';

export default function CustomerFeature() {
  const records = useMemo(() => listCustomerRecords(), []);
  const headline = useMemo(() => 'Customer module for modern.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="customer"
      data-modular-feature-v1="true"
      data-prompt-terms="customer"
    >
      <header className="modular-feature-header">
        <h2>Customer</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>modern — Customer</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Customer
        </button>
          <p data-validation-rules={CUSTOMER_VALIDATION.rules.length}>
            Validation rules: {CUSTOMER_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: CustomerRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
