import { useMemo } from 'react';
import type { ContactsRecord } from './contacts.types';
import { listContactsRecords } from './contacts.service';
import { CONTACTS_VALIDATION } from './contacts.validation';
import './contacts.module.css';

export default function ContactsFeature() {
  const records = useMemo(() => listContactsRecords(), []);
  const headline = useMemo(() => 'Search contacts and communication history.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="contacts"
      data-modular-feature-v1="true"
      data-prompt-terms="contacts,contact"
    >
      <header className="modular-feature-header">
        <h2>Contacts</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>CRM — Contacts</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Contacts
        </button>
          <p data-validation-rules={CONTACTS_VALIDATION.rules.length}>
            Validation rules: {CONTACTS_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: ContactsRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
