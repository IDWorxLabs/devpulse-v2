/** Validation metadata for wash — modern */
export const WASH_VALIDATION = {
  moduleId: 'wash',
  contractId: 'feature-wash',
  displayName: 'Wash',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Wash label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Wash label must be at least 2 characters' },
  ],
} as const;

export type WashValidationRule = (typeof WASH_VALIDATION.rules)[number];
