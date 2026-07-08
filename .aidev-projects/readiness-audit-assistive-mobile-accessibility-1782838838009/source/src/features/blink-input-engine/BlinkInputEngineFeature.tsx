import { useMemo } from 'react';
import type { BlinkInputEngineRecord } from './blink-input-engine.types';
import { listBlinkInputEngineRecords } from './blink-input-engine.service';
import { BLINK_INPUT_ENGINE_VALIDATION } from './blink-input-engine.validation';
import './blink-input-engine.module.css';

export default function BlinkInputEngineFeature() {
  const records = useMemo(() => listBlinkInputEngineRecords(), []);
  const headline = useMemo(() => 'Blink detection and simulation controls.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="blink-input-engine"
      data-modular-feature-v1="true"
      data-prompt-terms="blink input engine,blink"
    >
      <header className="modular-feature-header">
        <h2>Blink Input Engine</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>LISA — Locked In Syndrome App — Blink Input Engine</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Blink Input Engine
        </button>
          <p data-validation-rules={BLINK_INPUT_ENGINE_VALIDATION.rules.length}>
            Validation rules: {BLINK_INPUT_ENGINE_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: BlinkInputEngineRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
