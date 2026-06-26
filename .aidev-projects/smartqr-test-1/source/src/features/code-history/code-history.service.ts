/** Service adapter for code-history — Qr Code Scanning */
import type { CodeHistoryRecord } from './code-history.types';

const DEMO_CODE_HISTORY_RECORDS: CodeHistoryRecord[] = [
  { id: 'code-history-1', label: 'Sample Code History record', createdAt: new Date().toISOString() },
  { id: 'code-history-2', label: 'Code History preview entry', createdAt: new Date().toISOString() },
];

export function listCodeHistoryRecords(): CodeHistoryRecord[] {
  return DEMO_CODE_HISTORY_RECORDS;
}
