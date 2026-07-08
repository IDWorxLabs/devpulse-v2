/** Validation metadata for responsive — modern */
export const RESPONSIVE_VALIDATION = {
  moduleId: 'responsive',
  contractId: 'feature-responsive',
  displayName: 'Responsive',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Responsive label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Responsive label must be at least 2 characters' },
  ],
} as const;

export type ResponsiveValidationRule = (typeof RESPONSIVE_VALIDATION.rules)[number];
