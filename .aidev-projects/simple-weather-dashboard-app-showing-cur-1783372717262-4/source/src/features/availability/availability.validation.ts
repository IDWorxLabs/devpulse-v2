/** Validation metadata for availability — modern */
export const AVAILABILITY_VALIDATION = {
  moduleId: 'availability',
  contractId: 'feature-availability',
  displayName: 'Availability',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Availability label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Availability label must be at least 2 characters' },
  ],
} as const;

export type AvailabilityValidationRule = (typeof AVAILABILITY_VALIDATION.rules)[number];
