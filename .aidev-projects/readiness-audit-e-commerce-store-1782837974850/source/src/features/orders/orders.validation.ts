/** Validation metadata for orders — Custom App */
export const ORDERS_VALIDATION = {
  moduleId: 'orders',
  contractId: 'feature-orders',
  displayName: 'Orders',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Orders label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Orders label must be at least 2 characters' },
  ],
} as const;

export type OrdersValidationRule = (typeof ORDERS_VALIDATION.rules)[number];
