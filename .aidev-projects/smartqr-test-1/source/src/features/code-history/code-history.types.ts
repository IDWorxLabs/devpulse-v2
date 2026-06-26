/** Types for code-history feature module — Qr Code Scanning */
export interface CodeHistoryRecord {
  id: string;
  label: string;
  createdAt: string;
}

export interface CodeHistoryFormState {
  label: string;
}
