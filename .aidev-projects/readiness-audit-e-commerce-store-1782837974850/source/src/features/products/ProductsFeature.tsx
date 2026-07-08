import { useMemo } from 'react';
import type { ProductsRecord } from './products.types';
import { listProductsRecords } from './products.service';
import { PRODUCTS_VALIDATION } from './products.validation';
import './products.module.css';

export default function ProductsFeature() {
  const records = useMemo(() => listProductsRecords(), []);
  const headline = useMemo(() => 'Products module for Custom App.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="products"
      data-modular-feature-v1="true"
      data-prompt-terms="products"
    >
      <header className="modular-feature-header">
        <h2>Products</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>Custom App — Products</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Products
        </button>
          <p data-validation-rules={PRODUCTS_VALIDATION.rules.length}>
            Validation rules: {PRODUCTS_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: ProductsRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
