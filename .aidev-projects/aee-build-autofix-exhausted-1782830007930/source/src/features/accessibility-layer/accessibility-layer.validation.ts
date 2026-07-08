/** Validation metadata for accessibility-layer — LISA — Locked In Syndrome App */
export const ACCESSIBILITY_LAYER_VALIDATION = {
  moduleId: 'accessibility-layer',
  contractId: 'feature-accessibility-layer',
  displayName: 'Accessibility Layer',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Accessibility Layer label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Accessibility Layer label must be at least 2 characters' },
  ],
} as const;

export type AccessibilityLayerValidationRule = (typeof ACCESSIBILITY_LAYER_VALIDATION.rules)[number];
