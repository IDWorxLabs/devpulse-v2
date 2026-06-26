/** Validation metadata for generator — Qr Code Scanning */
export const GENERATOR_VALIDATION = {
  moduleId: 'generator',
  contractId: 'feature-generator',
  displayName: 'Generator',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Generator label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Generator label must be at least 2 characters' },
  ],
} as const;

export type GeneratorValidationRule = (typeof GENERATOR_VALIDATION.rules)[number];
