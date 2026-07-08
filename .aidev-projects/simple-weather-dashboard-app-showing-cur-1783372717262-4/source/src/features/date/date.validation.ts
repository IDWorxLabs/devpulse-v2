/** Validation metadata for date — modern */
export const DATE_VALIDATION = {
  moduleId: 'date',
  contractId: 'feature-date',
  displayName: 'Date',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Date label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Date label must be at least 2 characters' },
  ],
} as const;

export type DateValidationRule = (typeof DATE_VALIDATION.rules)[number];
