/** Types for notes feature module — reusable components where */
export interface NotesRecord {
  id: string;
  label: string;
  createdAt: string;
}

export interface NotesFormState {
  label: string;
}
