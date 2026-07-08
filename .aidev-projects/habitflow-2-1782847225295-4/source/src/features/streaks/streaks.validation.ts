/** Validation metadata for streaks — modern */
export const STREAKS_VALIDATION = {
  moduleId: 'streaks',
  contractId: 'feature-streaks',
  displayName: 'Streaks',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Streaks label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Streaks label must be at least 2 characters' },
  ],
} as const;

export type StreaksValidationRule = (typeof STREAKS_VALIDATION.rules)[number];
