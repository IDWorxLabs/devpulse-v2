/** Validation metadata for analytics — modern */
export const ANALYTICS_VALIDATION = {
  moduleId: 'analytics',
  contractId: 'feature-analytics',
  displayName: 'Analytics',
  interactionMode: 'informational',
  rules: [
    { field: 'label', rule: 'required', message: 'Analytics label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Analytics label must be at least 2 characters' },
  ],
} as const;

export type AnalyticsValidationRule = (typeof ANALYTICS_VALIDATION.rules)[number];
