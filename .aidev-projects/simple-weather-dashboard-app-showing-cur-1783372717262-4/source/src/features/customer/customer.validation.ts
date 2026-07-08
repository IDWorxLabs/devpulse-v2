/** Validation metadata for customer — modern */
export const CUSTOMER_VALIDATION = {
  moduleId: 'customer',
  contractId: 'feature-customer',
  displayName: 'Customer',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Customer label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Customer label must be at least 2 characters' },
  ],
} as const;

export type CustomerValidationRule = (typeof CUSTOMER_VALIDATION.rules)[number];
