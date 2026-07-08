import { useMemo } from 'react';
import type { InventoryRecord } from './inventory.types';
import { listInventoryRecords } from './inventory.service';
import { INVENTORY_VALIDATION } from './inventory.validation';
import './inventory.module.css';

export default function InventoryFeature() {
  const records = useMemo(() => listInventoryRecords(), []);
  const headline = useMemo(() => 'Inventory module for reusable components where.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="inventory"
      data-modular-feature-v1="true"
      data-prompt-terms="inventory"
    >
      <header className="modular-feature-header">
        <h2>Inventory</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>reusable components where — Inventory</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Inventory
        </button>
          <p data-validation-rules={INVENTORY_VALIDATION.rules.length}>
            Validation rules: {INVENTORY_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: InventoryRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
