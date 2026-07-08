/** Validation metadata for text-to-speech — LISA — Locked In Syndrome App */
export const TEXT_TO_SPEECH_VALIDATION = {
  moduleId: 'text-to-speech',
  contractId: 'feature-text-to-speech',
  displayName: 'Text To Speech',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Text To Speech label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Text To Speech label must be at least 2 characters' },
  ],
} as const;

export type TextToSpeechValidationRule = (typeof TEXT_TO_SPEECH_VALIDATION.rules)[number];
