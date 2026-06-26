/** Validation metadata for team — Lisa As A Real Modular */
export const TEAM_VALIDATION = {
  moduleId: 'team',
  contractId: 'feature-team',
  displayName: 'Team',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Team label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Team label must be at least 2 characters' },
  ],
} as const;

export type TeamValidationRule = (typeof TEAM_VALIDATION.rules)[number];
