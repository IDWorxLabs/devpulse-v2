/** Validation metadata for activities — Custom App */
export const ACTIVITIES_VALIDATION = {
  moduleId: 'activities',
  contractId: 'feature-activities',
  displayName: 'Activities',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Activities label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Activities label must be at least 2 characters' },
  ],
} as const;

export type ActivitiesValidationRule = (typeof ACTIVITIES_VALIDATION.rules)[number];
