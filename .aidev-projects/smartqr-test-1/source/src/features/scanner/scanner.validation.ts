/** Validation metadata for scanner — Qr Code Scanning */
export const SCANNER_VALIDATION = {
  moduleId: 'scanner',
  contractId: 'feature-scanner',
  displayName: 'Scanner',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Scanner label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Scanner label must be at least 2 characters' },
  ],
} as const;

export type ScannerValidationRule = (typeof SCANNER_VALIDATION.rules)[number];
