/** Types for settings feature module — modern expense tracking */
export interface SettingsRecord {
  id: string;
  label: string;
  createdAt: string;
}

export interface SettingsFormState {
  label: string;
}
