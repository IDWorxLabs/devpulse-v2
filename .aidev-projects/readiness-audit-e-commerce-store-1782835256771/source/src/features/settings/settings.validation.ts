/** Validation metadata for settings — Custom App */
export const SETTINGS_VALIDATION = {
  moduleId: 'settings',
  contractId: 'feature-settings',
  displayName: 'Settings',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Settings label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Settings label must be at least 2 characters' },
  ],
} as const;

export type SettingsValidationRule = (typeof SETTINGS_VALIDATION.rules)[number];
