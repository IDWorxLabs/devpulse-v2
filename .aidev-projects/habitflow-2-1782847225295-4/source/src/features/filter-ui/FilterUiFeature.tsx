import { useMemo } from 'react';
import type { FilterUiRecord } from './filter-ui.types';
import { listFilterUiRecords } from './filter-ui.service';
import { FILTER_UI_VALIDATION } from './filter-ui.validation';
import './filter-ui.module.css';

export default function FilterUiFeature() {
  const records = useMemo(() => listFilterUiRecords(), []);
  const headline = useMemo(() => 'Filter Ui module for modern.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="filter-ui"
      data-modular-feature-v1="true"
      data-prompt-terms="filter ui"
    >
      <header className="modular-feature-header">
        <h2>Filter Ui</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>modern — Filter Ui</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Filter Ui
        </button>
          <p data-validation-rules={FILTER_UI_VALIDATION.rules.length}>
            Validation rules: {FILTER_UI_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: FilterUiRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
