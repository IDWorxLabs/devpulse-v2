/** Validation metadata for payments — Custom App */
export const PAYMENTS_VALIDATION = {
  moduleId: 'payments',
  contractId: 'feature-payments',
  displayName: 'Payments',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Payments label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Payments label must be at least 2 characters' },
  ],
} as const;

export type PaymentsValidationRule = (typeof PAYMENTS_VALIDATION.rules)[number];
