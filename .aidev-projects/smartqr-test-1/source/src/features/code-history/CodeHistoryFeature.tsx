import { useMemo } from 'react';
import type { CodeHistoryRecord } from './code-history.types';
import { listCodeHistoryRecords } from './code-history.service';
import { CODE_HISTORY_VALIDATION } from './code-history.validation';
import './code-history.module.css';

export default function CodeHistoryFeature() {
  const records = useMemo(() => listCodeHistoryRecords(), []);
  const headline = useMemo(() => 'Review previously generated and scanned codes.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="code-history"
      data-modular-feature-v1="true"
      data-prompt-terms="code history,code,history"
    >
      <header className="modular-feature-header">
        <h2>Code History</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>Qr Code Scanning — Code History</h3>
          <p>{headline}</p>
          <p data-validation-rules={CODE_HISTORY_VALIDATION.rules.length}>
            Validation rules: {CODE_HISTORY_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: CodeHistoryRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
