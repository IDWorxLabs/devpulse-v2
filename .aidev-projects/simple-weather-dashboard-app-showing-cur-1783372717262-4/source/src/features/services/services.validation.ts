/** Validation metadata for services — modern */
export const SERVICES_VALIDATION = {
  moduleId: 'services',
  contractId: 'feature-services',
  displayName: 'Services',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Services label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Services label must be at least 2 characters' },
  ],
} as const;

export type ServicesValidationRule = (typeof SERVICES_VALIDATION.rules)[number];
