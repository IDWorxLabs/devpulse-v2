import { useMemo } from 'react';
import type { ChartsRecord } from './charts.types';
import { listChartsRecords } from './charts.service';
import { CHARTS_VALIDATION } from './charts.validation';
import './charts.module.css';

export default function ChartsFeature() {
  const records = useMemo(() => listChartsRecords(), []);
  const headline = useMemo(() => 'Charts module for modern.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="charts"
      data-modular-feature-v1="true"
      data-prompt-terms="charts"
    >
      <header className="modular-feature-header">
        <h2>Charts</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>modern — Charts</h3>
          <p>{headline}</p>
          <p data-validation-rules={CHARTS_VALIDATION.rules.length}>
            Validation rules: {CHARTS_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: ChartsRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
