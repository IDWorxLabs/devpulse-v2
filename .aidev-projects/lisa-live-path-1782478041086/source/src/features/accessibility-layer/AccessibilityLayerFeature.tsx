import { useMemo } from 'react';
import type { AccessibilityLayerRecord } from './accessibility-layer.types';
import { listAccessibilityLayerRecords } from './accessibility-layer.service';
import { ACCESSIBILITY_LAYER_VALIDATION } from './accessibility-layer.validation';
import './accessibility-layer.module.css';

export default function AccessibilityLayerFeature() {
  const records = useMemo(() => listAccessibilityLayerRecords(), []);
  const headline = useMemo(() => 'Accessibility Layer module for LISA — Locked In Syndrome App.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="accessibility-layer"
      data-modular-feature-v1="true"
      data-prompt-terms="accessibility layer"
    >
      <header className="modular-feature-header">
        <h2>Accessibility Layer</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>LISA — Locked In Syndrome App — Accessibility Layer</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Accessibility Layer
        </button>
          <p data-validation-rules={ACCESSIBILITY_LAYER_VALIDATION.rules.length}>
            Validation rules: {ACCESSIBILITY_LAYER_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: AccessibilityLayerRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
