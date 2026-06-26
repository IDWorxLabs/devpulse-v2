/** Validation metadata for reports — Expense Tracking */
export const REPORTS_VALIDATION = {
  moduleId: 'reports',
  contractId: 'feature-reports',
  displayName: 'Reports',
  interactionMode: 'informational',
  rules: [
    { field: 'label', rule: 'required', message: 'Reports label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Reports label must be at least 2 characters' },
  ],
} as const;

export type ReportsValidationRule = (typeof REPORTS_VALIDATION.rules)[number];
