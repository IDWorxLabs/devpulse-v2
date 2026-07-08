/** Validation metadata for filter-ui — Expense Tracker */
export const FILTER_UI_VALIDATION = {
  moduleId: 'filter-ui',
  contractId: 'feature-filter-ui',
  displayName: 'Filter Ui',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Filter Ui label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Filter Ui label must be at least 2 characters' },
  ],
} as const;

export type FilterUiValidationRule = (typeof FILTER_UI_VALIDATION.rules)[number];
