/** Validation metadata for styling — modern */
export const STYLING_VALIDATION = {
  moduleId: 'styling',
  contractId: 'feature-styling',
  displayName: 'Styling',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Styling label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Styling label must be at least 2 characters' },
  ],
} as const;

export type StylingValidationRule = (typeof STYLING_VALIDATION.rules)[number];
