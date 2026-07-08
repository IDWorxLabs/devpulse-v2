import { useMemo } from 'react';
import type { CommunicationHistoryRecord } from './communication-history.types';
import { listCommunicationHistoryRecords } from './communication-history.service';
import { COMMUNICATION_HISTORY_VALIDATION } from './communication-history.validation';
import './communication-history.module.css';

export default function CommunicationHistoryFeature() {
  const records = useMemo(() => listCommunicationHistoryRecords(), []);
  const headline = useMemo(() => 'Review and filter past messages.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="communication-history"
      data-modular-feature-v1="true"
      data-prompt-terms="communication history,communication"
    >
      <header className="modular-feature-header">
        <h2>Communication History</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>LISA — Locked In Syndrome App — Communication History</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Communication History
        </button>
          <p data-validation-rules={COMMUNICATION_HISTORY_VALIDATION.rules.length}>
            Validation rules: {COMMUNICATION_HISTORY_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: CommunicationHistoryRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
