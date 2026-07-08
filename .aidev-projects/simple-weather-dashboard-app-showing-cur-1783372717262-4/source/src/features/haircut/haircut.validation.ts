/** Validation metadata for haircut — modern */
export const HAIRCUT_VALIDATION = {
  moduleId: 'haircut',
  contractId: 'feature-haircut',
  displayName: 'Haircut',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Haircut label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Haircut label must be at least 2 characters' },
  ],
} as const;

export type HaircutValidationRule = (typeof HAIRCUT_VALIDATION.rules)[number];
