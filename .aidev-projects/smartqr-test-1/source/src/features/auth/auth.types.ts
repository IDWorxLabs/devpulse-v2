/** Types for auth feature module — Qr Code Scanning */
export interface AuthRecord {
  id: string;
  label: string;
  createdAt: string;
}

export interface AuthFormState {
  label: string;
}
