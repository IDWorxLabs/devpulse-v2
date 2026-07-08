/** Validation metadata for contacts — CRM */
export const CONTACTS_VALIDATION = {
  moduleId: 'contacts',
  contractId: 'feature-contacts',
  displayName: 'Contacts',
  interactionMode: 'interactive',
  rules: [
    { field: 'label', rule: 'required', message: 'Contacts label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Contacts label must be at least 2 characters' },
  ],
} as const;

export type ContactsValidationRule = (typeof CONTACTS_VALIDATION.rules)[number];
