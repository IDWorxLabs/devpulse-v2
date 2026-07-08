/** Validation metadata for staff — reusable components where */
export const STAFF_VALIDATION = {
  moduleId: 'staff',
  contractId: 'feature-staff',
  displayName: 'Staff',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Staff label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Staff label must be at least 2 characters' },
  ],
} as const;

export type StaffValidationRule = (typeof STAFF_VALIDATION.rules)[number];
