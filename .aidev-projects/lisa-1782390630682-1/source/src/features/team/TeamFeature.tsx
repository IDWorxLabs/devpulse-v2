import { useMemo } from 'react';
import type { TeamRecord } from './team.types';
import { listTeamRecords } from './team.service';
import { TEAM_VALIDATION } from './team.validation';
import './team.module.css';

export default function TeamFeature() {
  const records = useMemo(() => listTeamRecords(), []);
  const headline = useMemo(() => 'Team module for Lisa As A Real Modular.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="team"
      data-modular-feature-v1="true"
      data-prompt-terms="team"
    >
      <header className="modular-feature-header">
        <h2>Team</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>Lisa As A Real Modular — Team</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Team
        </button>
          <p data-validation-rules={TEAM_VALIDATION.rules.length}>
            Validation rules: {TEAM_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: TeamRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
