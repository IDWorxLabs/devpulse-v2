/** Validation metadata for code-history — Qr Code Scanning */
export const CODE_HISTORY_VALIDATION = {
  moduleId: 'code-history',
  contractId: 'feature-code-history',
  displayName: 'Code History',
  interactionMode: 'informational',
  rules: [
    { field: 'label', rule: 'required', message: 'Code History label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Code History label must be at least 2 characters' },
  ],
} as const;

export type CodeHistoryValidationRule = (typeof CODE_HISTORY_VALIDATION.rules)[number];
