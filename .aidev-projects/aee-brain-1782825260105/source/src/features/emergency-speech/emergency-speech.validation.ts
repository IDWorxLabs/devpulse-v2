/** Validation metadata for emergency-speech — LISA — Locked In Syndrome App */
export const EMERGENCY_SPEECH_VALIDATION = {
  moduleId: 'emergency-speech',
  contractId: 'feature-emergency-speech',
  displayName: 'Emergency Speech',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Emergency Speech label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Emergency Speech label must be at least 2 characters' },
  ],
} as const;

export type EmergencySpeechValidationRule = (typeof EMERGENCY_SPEECH_VALIDATION.rules)[number];
