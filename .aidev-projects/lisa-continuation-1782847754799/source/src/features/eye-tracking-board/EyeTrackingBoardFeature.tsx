import { useMemo } from 'react';
import type { EyeTrackingBoardRecord } from './eye-tracking-board.types';
import { listEyeTrackingBoardRecords } from './eye-tracking-board.service';
import { EYE_TRACKING_BOARD_VALIDATION } from './eye-tracking-board.validation';
import './eye-tracking-board.module.css';

export default function EyeTrackingBoardFeature() {
  const records = useMemo(() => listEyeTrackingBoardRecords(), []);
  const headline = useMemo(() => 'Eye-tracking communication board with large accessible tiles.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="eye-tracking-board"
      data-modular-feature-v1="true"
      data-prompt-terms="eye tracking board"
    >
      <header className="modular-feature-header">
        <h2>Eye Tracking Board</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>LISA — Locked In Syndrome App — Eye Tracking Board</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Eye Tracking Board
        </button>
          <p data-validation-rules={EYE_TRACKING_BOARD_VALIDATION.rules.length}>
            Validation rules: {EYE_TRACKING_BOARD_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: EyeTrackingBoardRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
