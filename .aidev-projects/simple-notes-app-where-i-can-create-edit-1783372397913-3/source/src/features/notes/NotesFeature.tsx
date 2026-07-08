import { useMemo } from 'react';
import type { NotesRecord } from './notes.types';
import { listNotesRecords } from './notes.service';
import { NOTES_VALIDATION } from './notes.validation';
import './notes.module.css';

export default function NotesFeature() {
  const records = useMemo(() => listNotesRecords(), []);
  const headline = useMemo(() => 'Notes for simple notes — a simple notes app where I can create, edit, and delete text notes.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="notes"
      data-modular-feature-v1="true"
      data-prompt-terms="notes"
    >
      <header className="modular-feature-header">
        <h2>Notes</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>simple notes — Notes</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Notes
        </button>
          <p data-validation-rules={NOTES_VALIDATION.rules.length}>
            Validation rules: {NOTES_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: NotesRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
