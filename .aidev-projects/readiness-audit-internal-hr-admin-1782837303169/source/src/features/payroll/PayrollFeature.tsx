import { useMemo } from 'react';
import type { PayrollRecord } from './payroll.types';
import { listPayrollRecords } from './payroll.service';
import { PAYROLL_VALIDATION } from './payroll.validation';
import './payroll.module.css';

export default function PayrollFeature() {
  const records = useMemo(() => listPayrollRecords(), []);
  const headline = useMemo(() => 'Payroll module for CRM.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="payroll"
      data-modular-feature-v1="true"
      data-prompt-terms="payroll"
    >
      <header className="modular-feature-header">
        <h2>Payroll</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>CRM — Payroll</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Payroll
        </button>
          <p data-validation-rules={PAYROLL_VALIDATION.rules.length}>
            Validation rules: {PAYROLL_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: PayrollRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
