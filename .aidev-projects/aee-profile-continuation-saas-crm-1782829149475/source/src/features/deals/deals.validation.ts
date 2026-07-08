/** Validation metadata for deals — CRM */
export const DEALS_VALIDATION = {
  moduleId: 'deals',
  contractId: 'feature-deals',
  displayName: 'Deals',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Deals label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Deals label must be at least 2 characters' },
  ],
} as const;

export type DealsValidationRule = (typeof DEALS_VALIDATION.rules)[number];
