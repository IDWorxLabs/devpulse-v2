import { useMemo } from 'react';
import type { EmployeesRecord } from './employees.types';
import { listEmployeesRecords } from './employees.service';
import { EMPLOYEES_VALIDATION } from './employees.validation';
import './employees.module.css';

export default function EmployeesFeature() {
  const records = useMemo(() => listEmployeesRecords(), []);
  const headline = useMemo(() => 'Employees module for CRM.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="employees"
      data-modular-feature-v1="true"
      data-prompt-terms="employees"
    >
      <header className="modular-feature-header">
        <h2>Employees</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>CRM — Employees</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Employees
        </button>
          <p data-validation-rules={EMPLOYEES_VALIDATION.rules.length}>
            Validation rules: {EMPLOYEES_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: EmployeesRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
