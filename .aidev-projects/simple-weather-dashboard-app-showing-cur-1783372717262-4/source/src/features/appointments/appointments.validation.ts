/** Validation metadata for appointments — modern */
export const APPOINTMENTS_VALIDATION = {
  moduleId: 'appointments',
  contractId: 'feature-appointments',
  displayName: 'Appointments',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Appointments label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Appointments label must be at least 2 characters' },
  ],
} as const;

export type AppointmentsValidationRule = (typeof APPOINTMENTS_VALIDATION.rules)[number];
