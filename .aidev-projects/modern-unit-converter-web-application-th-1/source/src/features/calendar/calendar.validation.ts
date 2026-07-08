/** Validation metadata for calendar — reusable components where */
export const CALENDAR_VALIDATION = {
  moduleId: 'calendar',
  contractId: 'feature-calendar',
  displayName: 'Calendar',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Calendar label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Calendar label must be at least 2 characters' },
  ],
} as const;

export type CalendarValidationRule = (typeof CALENDAR_VALIDATION.rules)[number];
