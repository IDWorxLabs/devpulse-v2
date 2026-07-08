/** Validation metadata for customers — reusable components where */
export const CUSTOMERS_VALIDATION = {
  moduleId: 'customers',
  contractId: 'feature-customers',
  displayName: 'Customers',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Customers label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Customers label must be at least 2 characters' },
  ],
} as const;

export type CustomersValidationRule = (typeof CUSTOMERS_VALIDATION.rules)[number];
