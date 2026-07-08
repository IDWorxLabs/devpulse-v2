/** Types for communication-history feature module — LISA — Locked In Syndrome App */
export interface CommunicationHistoryRecord {
  id: string;
  label: string;
  createdAt: string;
}

export interface CommunicationHistoryFormState {
  label: string;
}
