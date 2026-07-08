/** Validation metadata for onboarding-calibration — LISA — Locked In Syndrome App */
export const ONBOARDING_CALIBRATION_VALIDATION = {
  moduleId: 'onboarding-calibration',
  contractId: 'feature-onboarding-calibration',
  displayName: 'Onboarding Calibration',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Onboarding Calibration label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Onboarding Calibration label must be at least 2 characters' },
  ],
} as const;

export type OnboardingCalibrationValidationRule = (typeof ONBOARDING_CALIBRATION_VALIDATION.rules)[number];
