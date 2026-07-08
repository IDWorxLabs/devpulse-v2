/** Validation metadata for currency — reusable components where */
export const CURRENCY_VALIDATION = {
  moduleId: 'currency',
  contractId: 'feature-currency',
  displayName: 'Currency',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Currency label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Currency label must be at least 2 characters' },
  ],
} as const;

export type CurrencyValidationRule = (typeof CURRENCY_VALIDATION.rules)[number];
