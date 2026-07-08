/** Validation metadata for eye-tracking-board — LISA — Locked In Syndrome App */
export const EYE_TRACKING_BOARD_VALIDATION = {
  moduleId: 'eye-tracking-board',
  contractId: 'feature-eye-tracking-board',
  displayName: 'Eye Tracking Board',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Eye Tracking Board label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Eye Tracking Board label must be at least 2 characters' },
  ],
} as const;

export type EyeTrackingBoardValidationRule = (typeof EYE_TRACKING_BOARD_VALIDATION.rules)[number];
