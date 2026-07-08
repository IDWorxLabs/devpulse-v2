/** Validation metadata for goals — modern */
export const GOALS_VALIDATION = {
  moduleId: 'goals',
  contractId: 'feature-goals',
  displayName: 'Goals',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Goals label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Goals label must be at least 2 characters' },
  ],
} as const;

export type GoalsValidationRule = (typeof GOALS_VALIDATION.rules)[number];
