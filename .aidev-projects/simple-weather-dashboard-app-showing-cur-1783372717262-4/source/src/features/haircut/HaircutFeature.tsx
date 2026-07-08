import { useMemo } from 'react';
import type { HaircutRecord } from './haircut.types';
import { listHaircutRecords } from './haircut.service';
import { HAIRCUT_VALIDATION } from './haircut.validation';
import './haircut.module.css';

export default function HaircutFeature() {
  const records = useMemo(() => listHaircutRecords(), []);
  const headline = useMemo(() => 'Haircut module for modern.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="haircut"
      data-modular-feature-v1="true"
      data-prompt-terms="haircut"
    >
      <header className="modular-feature-header">
        <h2>Haircut</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>modern — Haircut</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Haircut
        </button>
          <p data-validation-rules={HAIRCUT_VALIDATION.rules.length}>
            Validation rules: {HAIRCUT_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: HaircutRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
