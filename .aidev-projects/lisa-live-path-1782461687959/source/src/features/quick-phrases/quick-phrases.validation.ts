/** Validation metadata for quick-phrases — LISA — Locked In Syndrome App */
export const QUICK_PHRASES_VALIDATION = {
  moduleId: 'quick-phrases',
  contractId: 'feature-quick-phrases',
  displayName: 'Quick Phrases',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Quick Phrases label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Quick Phrases label must be at least 2 characters' },
  ],
} as const;

export type QuickPhrasesValidationRule = (typeof QUICK_PHRASES_VALIDATION.rules)[number];
