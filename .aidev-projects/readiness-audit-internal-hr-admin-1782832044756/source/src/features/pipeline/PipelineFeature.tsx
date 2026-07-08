import { useMemo } from 'react';
import type { PipelineRecord } from './pipeline.types';
import { listPipelineRecords } from './pipeline.service';
import { PIPELINE_VALIDATION } from './pipeline.validation';
import './pipeline.module.css';

export default function PipelineFeature() {
  const records = useMemo(() => listPipelineRecords(), []);
  const headline = useMemo(() => 'Move opportunities through pipeline stages.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="pipeline"
      data-modular-feature-v1="true"
      data-prompt-terms="pipeline"
    >
      <header className="modular-feature-header">
        <h2>Pipeline</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>CRM — Pipeline</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Pipeline
        </button>
          <p data-validation-rules={PIPELINE_VALIDATION.rules.length}>
            Validation rules: {PIPELINE_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: PipelineRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
