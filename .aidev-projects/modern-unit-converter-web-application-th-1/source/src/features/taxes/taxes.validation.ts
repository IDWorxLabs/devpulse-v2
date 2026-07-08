/** Validation metadata for taxes — reusable components where */
export const TAXES_VALIDATION = {
  moduleId: 'taxes',
  contractId: 'feature-taxes',
  displayName: 'Taxes',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Taxes label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Taxes label must be at least 2 characters' },
  ],
} as const;

export type TaxesValidationRule = (typeof TAXES_VALIDATION.rules)[number];
