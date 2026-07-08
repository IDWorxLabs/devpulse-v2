/** Validation metadata for employees — CRM */
export const EMPLOYEES_VALIDATION = {
  moduleId: 'employees',
  contractId: 'feature-employees',
  displayName: 'Employees',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Employees label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Employees label must be at least 2 characters' },
  ],
} as const;

export type EmployeesValidationRule = (typeof EMPLOYEES_VALIDATION.rules)[number];
