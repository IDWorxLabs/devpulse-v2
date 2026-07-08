/** Validation metadata for gaze-keyboard — LISA — Locked In Syndrome App */
export const GAZE_KEYBOARD_VALIDATION = {
  moduleId: 'gaze-keyboard',
  contractId: 'feature-gaze-keyboard',
  displayName: 'Gaze Keyboard',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Gaze Keyboard label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Gaze Keyboard label must be at least 2 characters' },
  ],
} as const;

export type GazeKeyboardValidationRule = (typeof GAZE_KEYBOARD_VALIDATION.rules)[number];
