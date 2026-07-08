/** Validation metadata for time — modern */
export const TIME_VALIDATION = {
  moduleId: 'time',
  contractId: 'feature-time',
  displayName: 'Time',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Time label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Time label must be at least 2 characters' },
  ],
} as const;

export type TimeValidationRule = (typeof TIME_VALIDATION.rules)[number];
