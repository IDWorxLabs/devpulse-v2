/** Validation metadata for notes — reusable components where */
export const NOTES_VALIDATION = {
  moduleId: 'notes',
  contractId: 'feature-notes',
  displayName: 'Notes',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Notes label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Notes label must be at least 2 characters' },
  ],
} as const;

export type NotesValidationRule = (typeof NOTES_VALIDATION.rules)[number];
