/** Validation metadata for communication-history — LISA — Locked In Syndrome App */
export const COMMUNICATION_HISTORY_VALIDATION = {
  moduleId: 'communication-history',
  contractId: 'feature-communication-history',
  displayName: 'Communication History',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Communication History label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Communication History label must be at least 2 characters' },
  ],
} as const;

export type CommunicationHistoryValidationRule = (typeof COMMUNICATION_HISTORY_VALIDATION.rules)[number];
