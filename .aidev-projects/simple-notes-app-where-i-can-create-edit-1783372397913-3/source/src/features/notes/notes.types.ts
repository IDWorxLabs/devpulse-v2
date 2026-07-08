/** Types for notes feature module — simple notes */
export interface NotesRecord {
  id: string;
  label: string;
  createdAt: string;
}

export interface NotesFormState {
  label: string;
}
