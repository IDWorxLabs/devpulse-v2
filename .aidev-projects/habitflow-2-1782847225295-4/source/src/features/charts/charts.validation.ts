/** Validation metadata for charts — modern */
export const CHARTS_VALIDATION = {
  moduleId: 'charts',
  contractId: 'feature-charts',
  displayName: 'Charts',
  interactionMode: 'informational',
  rules: [
    { field: 'label', rule: 'required', message: 'Charts label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Charts label must be at least 2 characters' },
  ],
} as const;

export type ChartsValidationRule = (typeof CHARTS_VALIDATION.rules)[number];
