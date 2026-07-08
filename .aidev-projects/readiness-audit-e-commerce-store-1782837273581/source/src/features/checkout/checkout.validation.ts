/** Validation metadata for checkout — Custom App */
export const CHECKOUT_VALIDATION = {
  moduleId: 'checkout',
  contractId: 'feature-checkout',
  displayName: 'Checkout',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Checkout label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Checkout label must be at least 2 characters' },
  ],
} as const;

export type CheckoutValidationRule = (typeof CHECKOUT_VALIDATION.rules)[number];
