/** Validation metadata for dashboard — Qr Code Scanning */
export const DASHBOARD_VALIDATION = {
  moduleId: 'dashboard',
  contractId: 'feature-dashboard',
  displayName: 'Dashboard',
  interactionMode: 'informational',
  rules: [
    { field: 'label', rule: 'required', message: 'Dashboard label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Dashboard label must be at least 2 characters' },
  ],
} as const;

export type DashboardValidationRule = (typeof DASHBOARD_VALIDATION.rules)[number];
