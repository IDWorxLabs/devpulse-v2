import { useMemo } from 'react';
import type { GeneratorRecord } from './generator.types';
import { listGeneratorRecords } from './generator.service';
import { GENERATOR_VALIDATION } from './generator.validation';
import './generator.module.css';

export default function GeneratorFeature() {
  const records = useMemo(() => listGeneratorRecords(), []);
  const headline = useMemo(() => 'Create QR codes from text or URLs.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="generator"
      data-modular-feature-v1="true"
      data-prompt-terms="generator"
    >
      <header className="modular-feature-header">
        <h2>Generator</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>Qr Code Scanning — Generator</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Generator
        </button>
          <p data-validation-rules={GENERATOR_VALIDATION.rules.length}>
            Validation rules: {GENERATOR_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: GeneratorRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
