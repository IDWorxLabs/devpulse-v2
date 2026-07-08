import { useMemo } from 'react';
import type { GazeKeyboardRecord } from './gaze-keyboard.types';
import { listGazeKeyboardRecords } from './gaze-keyboard.service';
import { GAZE_KEYBOARD_VALIDATION } from './gaze-keyboard.validation';
import './gaze-keyboard.module.css';

export default function GazeKeyboardFeature() {
  const records = useMemo(() => listGazeKeyboardRecords(), []);
  const headline = useMemo(() => 'Gaze-based keyboard for composing messages with large accessible keys.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="gaze-keyboard"
      data-modular-feature-v1="true"
      data-prompt-terms="gaze keyboard"
    >
      <header className="modular-feature-header">
        <h2>Gaze Keyboard</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>LISA — Locked In Syndrome App — Gaze Keyboard</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Gaze Keyboard
        </button>
          <p data-validation-rules={GAZE_KEYBOARD_VALIDATION.rules.length}>
            Validation rules: {GAZE_KEYBOARD_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: GazeKeyboardRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
