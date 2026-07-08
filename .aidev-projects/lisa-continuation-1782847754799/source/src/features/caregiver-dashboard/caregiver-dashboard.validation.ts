/** Validation metadata for caregiver-dashboard — LISA — Locked In Syndrome App */
export const CAREGIVER_DASHBOARD_VALIDATION = {
  moduleId: 'caregiver-dashboard',
  contractId: 'feature-caregiver-dashboard',
  displayName: 'Caregiver Dashboard',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Caregiver Dashboard label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Caregiver Dashboard label must be at least 2 characters' },
  ],
} as const;

export type CaregiverDashboardValidationRule = (typeof CAREGIVER_DASHBOARD_VALIDATION.rules)[number];
