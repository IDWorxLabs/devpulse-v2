/** Validation metadata for products — Custom App */
export const PRODUCTS_VALIDATION = {
  moduleId: 'products',
  contractId: 'feature-products',
  displayName: 'Products',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Products label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Products label must be at least 2 characters' },
  ],
} as const;

export type ProductsValidationRule = (typeof PRODUCTS_VALIDATION.rules)[number];
