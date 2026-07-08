/** Validation metadata for habits — modern */
export const HABITS_VALIDATION = {
  moduleId: 'habits',
  contractId: 'feature-habits',
  displayName: 'Habits',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Habits label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Habits label must be at least 2 characters' },
  ],
} as const;

export type HabitsValidationRule = (typeof HABITS_VALIDATION.rules)[number];
