import { useMemo } from 'react';
import type { EmergencySpeechRecord } from './emergency-speech.types';
import { listEmergencySpeechRecords } from './emergency-speech.service';
import { EMERGENCY_SPEECH_VALIDATION } from './emergency-speech.validation';
import './emergency-speech.module.css';

export default function EmergencySpeechFeature() {
  const records = useMemo(() => listEmergencySpeechRecords(), []);
  const headline = useMemo(() => 'One-tap emergency speech phrase.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="emergency-speech"
      data-modular-feature-v1="true"
      data-prompt-terms="emergency speech,speech,emergency"
    >
      <header className="modular-feature-header">
        <h2>Emergency Speech</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>LISA — Locked In Syndrome App — Emergency Speech</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Emergency Speech
        </button>
          <p data-validation-rules={EMERGENCY_SPEECH_VALIDATION.rules.length}>
            Validation rules: {EMERGENCY_SPEECH_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: EmergencySpeechRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
