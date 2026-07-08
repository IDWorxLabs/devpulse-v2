/** Validation metadata for counter — simple counter */
export const COUNTER_VALIDATION = {
  moduleId: 'counter',
  contractId: 'feature-counter',
  displayName: 'Counter',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Counter label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Counter label must be at least 2 characters' },
  ],
} as const;

export type CounterValidationRule = (typeof COUNTER_VALIDATION.rules)[number];
