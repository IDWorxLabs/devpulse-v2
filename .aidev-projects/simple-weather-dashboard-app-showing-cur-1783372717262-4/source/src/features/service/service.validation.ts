/** Validation metadata for service — modern */
export const SERVICE_VALIDATION = {
  moduleId: 'service',
  contractId: 'feature-service',
  displayName: 'Service',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Service label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Service label must be at least 2 characters' },
  ],
} as const;

export type ServiceValidationRule = (typeof SERVICE_VALIDATION.rules)[number];
