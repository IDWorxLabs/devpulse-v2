/** Validation metadata for locked-in — LISA — Locked In Syndrome App */
export const LOCKED_IN_VALIDATION = {
  moduleId: 'locked-in',
  contractId: 'feature-locked-in',
  displayName: 'Locked In',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Locked In label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Locked In label must be at least 2 characters' },
  ],
} as const;

export type LockedInValidationRule = (typeof LOCKED_IN_VALIDATION.rules)[number];
