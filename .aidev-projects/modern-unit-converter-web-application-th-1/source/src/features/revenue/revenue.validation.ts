/** Validation metadata for revenue — reusable components where */
export const REVENUE_VALIDATION = {
  moduleId: 'revenue',
  contractId: 'feature-revenue',
  displayName: 'Revenue',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Revenue label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Revenue label must be at least 2 characters' },
  ],
} as const;

export type RevenueValidationRule = (typeof REVENUE_VALIDATION.rules)[number];
