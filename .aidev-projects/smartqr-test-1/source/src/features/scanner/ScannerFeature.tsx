import { useMemo } from 'react';
import type { ScannerRecord } from './scanner.types';
import { listScannerRecords } from './scanner.service';
import { SCANNER_VALIDATION } from './scanner.validation';
import './scanner.module.css';

export default function ScannerFeature() {
  const records = useMemo(() => listScannerRecords(), []);
  const headline = useMemo(() => 'Scan QR codes with camera or manual input.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="scanner"
      data-modular-feature-v1="true"
      data-prompt-terms="scanner,scan"
    >
      <header className="modular-feature-header">
        <h2>Scanner</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>Qr Code Scanning — Scanner</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Scanner
        </button>
          <p data-validation-rules={SCANNER_VALIDATION.rules.length}>
            Validation rules: {SCANNER_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: ScannerRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
