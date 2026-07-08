/** Validation metadata for onboarding — CRM */
export const ONBOARDING_VALIDATION = {
  moduleId: 'onboarding',
  contractId: 'feature-onboarding',
  displayName: 'Onboarding',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Onboarding label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Onboarding label must be at least 2 characters' },
  ],
} as const;

export type OnboardingValidationRule = (typeof ONBOARDING_VALIDATION.rules)[number];
