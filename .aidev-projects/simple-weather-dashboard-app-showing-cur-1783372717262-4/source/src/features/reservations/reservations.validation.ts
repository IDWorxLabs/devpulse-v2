/** Validation metadata for reservations — modern */
export const RESERVATIONS_VALIDATION = {
  moduleId: 'reservations',
  contractId: 'feature-reservations',
  displayName: 'Reservations',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Reservations label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Reservations label must be at least 2 characters' },
  ],
} as const;

export type ReservationsValidationRule = (typeof RESERVATIONS_VALIDATION.rules)[number];
