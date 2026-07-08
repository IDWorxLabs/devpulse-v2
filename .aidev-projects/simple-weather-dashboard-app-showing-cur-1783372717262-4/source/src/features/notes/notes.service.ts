/** Service adapter for notes — modern */
import type { NotesRecord } from './notes.types';

const DEMO_NOTES_RECORDS: NotesRecord[] = [
  { id: 'notes-1', label: 'Sample Notes record', createdAt: new Date().toISOString() },
  { id: 'notes-2', label: 'Notes preview entry', createdAt: new Date().toISOString() },
];

export function listNotesRecords(): NotesRecord[] {
  return DEMO_NOTES_RECORDS;
}
