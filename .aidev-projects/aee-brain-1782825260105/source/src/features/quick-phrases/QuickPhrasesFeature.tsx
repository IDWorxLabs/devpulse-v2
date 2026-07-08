import { useMemo } from 'react';
import type { QuickPhrasesRecord } from './quick-phrases.types';
import { listQuickPhrasesRecords } from './quick-phrases.service';
import { QUICK_PHRASES_VALIDATION } from './quick-phrases.validation';
import './quick-phrases.module.css';

export default function QuickPhrasesFeature() {
  const records = useMemo(() => listQuickPhrasesRecords(), []);
  const headline = useMemo(() => 'Quick phrase tiles for fast communication without typing.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="quick-phrases"
      data-modular-feature-v1="true"
      data-prompt-terms="quick phrases"
    >
      <header className="modular-feature-header">
        <h2>Quick Phrases</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>LISA — Locked In Syndrome App — Quick Phrases</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Quick Phrases
        </button>
          <p data-validation-rules={QUICK_PHRASES_VALIDATION.rules.length}>
            Validation rules: {QUICK_PHRASES_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: QuickPhrasesRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
