/** Service adapter for streaks — modern */
import type { StreaksRecord } from './streaks.types';

const DEMO_STREAKS_RECORDS: StreaksRecord[] = [
  { id: 'streaks-1', label: 'Sample Streaks record', createdAt: new Date().toISOString() },
  { id: 'streaks-2', label: 'Streaks preview entry', createdAt: new Date().toISOString() },
];

export function listStreaksRecords(): StreaksRecord[] {
  return DEMO_STREAKS_RECORDS;
}
