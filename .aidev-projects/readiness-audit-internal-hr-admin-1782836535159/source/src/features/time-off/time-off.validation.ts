/** Validation metadata for time-off — CRM */
export const TIME_OFF_VALIDATION = {
  moduleId: 'time-off',
  contractId: 'feature-time-off',
  displayName: 'Time Off',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Time Off label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Time Off label must be at least 2 characters' },
  ],
} as const;

export type TimeOffValidationRule = (typeof TIME_OFF_VALIDATION.rules)[number];
