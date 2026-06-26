import { useMemo } from 'react';
import type { CsvExportRecord } from './csv-export.types';
import { listCsvExportRecords } from './csv-export.service';
import { CSV_EXPORT_VALIDATION } from './csv-export.validation';
import './csv-export.module.css';

export default function CsvExportFeature() {
  const records = useMemo(() => listCsvExportRecords(), []);
  const headline = useMemo(() => 'Export transactions to CSV for accounting.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="csv-export"
      data-modular-feature-v1="true"
      data-prompt-terms="csv export,csv"
    >
      <header className="modular-feature-header">
        <h2>Csv Export</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>Expense Tracking — Csv Export</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Csv Export
        </button>
          <p data-validation-rules={CSV_EXPORT_VALIDATION.rules.length}>
            Validation rules: {CSV_EXPORT_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: CsvExportRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
