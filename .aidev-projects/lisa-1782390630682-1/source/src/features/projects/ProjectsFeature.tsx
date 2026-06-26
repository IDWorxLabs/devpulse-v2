import { useMemo } from 'react';
import type { ProjectsRecord } from './projects.types';
import { listProjectsRecords } from './projects.service';
import { PROJECTS_VALIDATION } from './projects.validation';
import './projects.module.css';

export default function ProjectsFeature() {
  const records = useMemo(() => listProjectsRecords(), []);
  const headline = useMemo(() => 'Projects module for Lisa As A Real Modular.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="projects"
      data-modular-feature-v1="true"
      data-prompt-terms="projects,project"
    >
      <header className="modular-feature-header">
        <h2>Projects</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>Lisa As A Real Modular — Projects</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Projects
        </button>
          <p data-validation-rules={PROJECTS_VALIDATION.rules.length}>
            Validation rules: {PROJECTS_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: ProjectsRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
