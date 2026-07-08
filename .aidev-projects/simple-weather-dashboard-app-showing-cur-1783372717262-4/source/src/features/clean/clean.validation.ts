/** Validation metadata for clean — modern */
export const CLEAN_VALIDATION = {
  moduleId: 'clean',
  contractId: 'feature-clean',
  displayName: 'Clean',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Clean label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Clean label must be at least 2 characters' },
  ],
} as const;

export type CleanValidationRule = (typeof CLEAN_VALIDATION.rules)[number];
