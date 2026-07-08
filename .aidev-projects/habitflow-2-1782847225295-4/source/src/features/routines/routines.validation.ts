/** Validation metadata for routines — modern */
export const ROUTINES_VALIDATION = {
  moduleId: 'routines',
  contractId: 'feature-routines',
  displayName: 'Routines',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Routines label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Routines label must be at least 2 characters' },
  ],
} as const;

export type RoutinesValidationRule = (typeof ROUTINES_VALIDATION.rules)[number];
