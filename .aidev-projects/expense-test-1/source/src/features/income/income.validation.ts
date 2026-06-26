/** Validation metadata for income — Expense Tracking */
export const INCOME_VALIDATION = {
  moduleId: 'income',
  contractId: 'feature-income',
  displayName: 'Income',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Income label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Income label must be at least 2 characters' },
  ],
} as const;

export type IncomeValidationRule = (typeof INCOME_VALIDATION.rules)[number];
