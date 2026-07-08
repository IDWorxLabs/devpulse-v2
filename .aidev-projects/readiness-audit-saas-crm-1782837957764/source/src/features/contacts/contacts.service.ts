/** Service adapter for contacts — CRM */
import type { ContactsRecord } from './contacts.types';

const DEMO_CONTACTS_RECORDS: ContactsRecord[] = [
  { id: 'contacts-1', label: 'Sample Contacts record', createdAt: new Date().toISOString() },
  { id: 'contacts-2', label: 'Contacts preview entry', createdAt: new Date().toISOString() },
];

export function listContactsRecords(): ContactsRecord[] {
  return DEMO_CONTACTS_RECORDS;
}
