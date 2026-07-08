/** Validation metadata for modern — modern */
export const MODERN_VALIDATION = {
  moduleId: 'modern',
  contractId: 'feature-modern',
  displayName: 'Modern',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Modern label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Modern label must be at least 2 characters' },
  ],
} as const;

export type ModernValidationRule = (typeof MODERN_VALIDATION.rules)[number];
