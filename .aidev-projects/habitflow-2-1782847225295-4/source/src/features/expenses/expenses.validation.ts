/** Validation metadata for expenses — modern */
export const EXPENSES_VALIDATION = {
  moduleId: 'expenses',
  contractId: 'feature-expenses',
  displayName: 'Expenses',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Expenses label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Expenses label must be at least 2 characters' },
  ],
} as const;

export type ExpensesValidationRule = (typeof EXPENSES_VALIDATION.rules)[number];
