/** Validation metadata for calculator — calculator */
export const CALCULATOR_VALIDATION = {
  moduleId: 'calculator',
  contractId: 'feature-calculator',
  displayName: 'Calculator',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Calculator label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Calculator label must be at least 2 characters' },
  ],
} as const;

export type CalculatorValidationRule = (typeof CALCULATOR_VALIDATION.rules)[number];
