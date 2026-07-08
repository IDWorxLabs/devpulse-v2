/** Validation metadata for accessibility-settings — LISA — Locked In Syndrome App */
export const ACCESSIBILITY_SETTINGS_VALIDATION = {
  moduleId: 'accessibility-settings',
  contractId: 'feature-accessibility-settings',
  displayName: 'Accessibility Settings',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Accessibility Settings label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Accessibility Settings label must be at least 2 characters' },
  ],
} as const;

export type AccessibilitySettingsValidationRule = (typeof ACCESSIBILITY_SETTINGS_VALIDATION.rules)[number];
