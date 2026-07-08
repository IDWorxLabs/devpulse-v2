import { useMemo } from 'react';
import type { CategoriesRecord } from './categories.types';
import { listCategoriesRecords } from './categories.service';
import { CATEGORIES_VALIDATION } from './categories.validation';
import './categories.module.css';

export default function CategoriesFeature() {
  const records = useMemo(() => listCategoriesRecords(), []);
  const headline = useMemo(() => 'Manage expense and income categories.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="categories"
      data-modular-feature-v1="true"
      data-prompt-terms="categories"
    >
      <header className="modular-feature-header">
        <h2>Categories</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>modern expense tracking — Categories</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Categories
        </button>
          <p data-validation-rules={CATEGORIES_VALIDATION.rules.length}>
            Validation rules: {CATEGORIES_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: CategoriesRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
