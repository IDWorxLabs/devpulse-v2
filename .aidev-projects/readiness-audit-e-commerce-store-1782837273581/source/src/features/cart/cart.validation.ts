/** Validation metadata for cart — Custom App */
export const CART_VALIDATION = {
  moduleId: 'cart',
  contractId: 'feature-cart',
  displayName: 'Cart',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Cart label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Cart label must be at least 2 characters' },
  ],
} as const;

export type CartValidationRule = (typeof CART_VALIDATION.rules)[number];
