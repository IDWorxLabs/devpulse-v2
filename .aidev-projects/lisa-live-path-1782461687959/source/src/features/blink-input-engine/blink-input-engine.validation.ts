/** Validation metadata for blink-input-engine — LISA — Locked In Syndrome App */
export const BLINK_INPUT_ENGINE_VALIDATION = {
  moduleId: 'blink-input-engine',
  contractId: 'feature-blink-input-engine',
  displayName: 'Blink Input Engine',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Blink Input Engine label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Blink Input Engine label must be at least 2 characters' },
  ],
} as const;

export type BlinkInputEngineValidationRule = (typeof BLINK_INPUT_ENGINE_VALIDATION.rules)[number];
