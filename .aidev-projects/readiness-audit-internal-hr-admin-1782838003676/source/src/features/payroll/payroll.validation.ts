/** Validation metadata for payroll — CRM */
export const PAYROLL_VALIDATION = {
  moduleId: 'payroll',
  contractId: 'feature-payroll',
  displayName: 'Payroll',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Payroll label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Payroll label must be at least 2 characters' },
  ],
} as const;

export type PayrollValidationRule = (typeof PAYROLL_VALIDATION.rules)[number];
