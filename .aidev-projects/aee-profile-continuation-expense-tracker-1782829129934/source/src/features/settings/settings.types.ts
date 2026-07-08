/** Types for settings feature module — Expense Tracker */
export interface SettingsRecord {
  id: string;
  label: string;
  createdAt: string;
}

export interface SettingsFormState {
  label: string;
}
