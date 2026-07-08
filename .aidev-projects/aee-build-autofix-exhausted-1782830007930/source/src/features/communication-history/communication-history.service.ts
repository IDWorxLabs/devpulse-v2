/** Service adapter for communication-history — LISA — Locked In Syndrome App */
import type { CommunicationHistoryRecord } from './communication-history.types';

const DEMO_COMMUNICATION_HISTORY_RECORDS: CommunicationHistoryRecord[] = [
  { id: 'communication-history-1', label: 'Sample Communication History record', createdAt: new Date().toISOString() },
  { id: 'communication-history-2', label: 'Communication History preview entry', createdAt: new Date().toISOString() },
];

export function listCommunicationHistoryRecords(): CommunicationHistoryRecord[] {
  return DEMO_COMMUNICATION_HISTORY_RECORDS;
}
