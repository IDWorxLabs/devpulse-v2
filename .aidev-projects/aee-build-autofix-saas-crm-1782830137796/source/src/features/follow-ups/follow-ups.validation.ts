/** Validation metadata for follow-ups — CRM */
export const FOLLOW_UPS_VALIDATION = {
  moduleId: 'follow-ups',
  contractId: 'feature-follow-ups',
  displayName: 'Follow Ups',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Follow Ups label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Follow Ups label must be at least 2 characters' },
  ],
} as const;

export type FollowUpsValidationRule = (typeof FOLLOW_UPS_VALIDATION.rules)[number];
