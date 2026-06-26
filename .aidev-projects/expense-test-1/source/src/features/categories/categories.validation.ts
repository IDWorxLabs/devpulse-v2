/** Validation metadata for categories — Expense Tracking */
export const CATEGORIES_VALIDATION = {
  moduleId: 'categories',
  contractId: 'feature-categories',
  displayName: 'Categories',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Categories label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Categories label must be at least 2 characters' },
  ],
} as const;

export type CategoriesValidationRule = (typeof CATEGORIES_VALIDATION.rules)[number];
