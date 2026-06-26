/** Validation metadata for timeline — Lisa As A Real Modular */
export const TIMELINE_VALIDATION = {
  moduleId: 'timeline',
  contractId: 'feature-timeline',
  displayName: 'Timeline',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Timeline label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Timeline label must be at least 2 characters' },
  ],
} as const;

export type TimelineValidationRule = (typeof TIMELINE_VALIDATION.rules)[number];
