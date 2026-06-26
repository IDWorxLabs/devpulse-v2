/** Validation metadata for auth — Lisa As A Real Modular */
export const AUTH_VALIDATION = {
  moduleId: 'auth',
  contractId: 'feature-auth',
  displayName: 'Auth',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Auth label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Auth label must be at least 2 characters' },
  ],
} as const;

export type AuthValidationRule = (typeof AUTH_VALIDATION.rules)[number];
