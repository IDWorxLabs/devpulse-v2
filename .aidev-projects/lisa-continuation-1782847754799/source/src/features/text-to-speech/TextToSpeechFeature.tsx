import { useMemo } from 'react';
import type { TextToSpeechRecord } from './text-to-speech.types';
import { listTextToSpeechRecords } from './text-to-speech.service';
import { TEXT_TO_SPEECH_VALIDATION } from './text-to-speech.validation';
import './text-to-speech.module.css';

export default function TextToSpeechFeature() {
  const records = useMemo(() => listTextToSpeechRecords(), []);
  const headline = useMemo(() => 'Convert composed messages to speech output.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="text-to-speech"
      data-modular-feature-v1="true"
      data-prompt-terms="text to speech,speech"
    >
      <header className="modular-feature-header">
        <h2>Text To Speech</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>LISA — Locked In Syndrome App — Text To Speech</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Text To Speech
        </button>
          <p data-validation-rules={TEXT_TO_SPEECH_VALIDATION.rules.length}>
            Validation rules: {TEXT_TO_SPEECH_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: TextToSpeechRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
