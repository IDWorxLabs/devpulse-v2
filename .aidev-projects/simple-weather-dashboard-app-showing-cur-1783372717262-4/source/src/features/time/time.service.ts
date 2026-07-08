/** Service adapter for time — modern */
import type { TimeRecord } from './time.types';

const DEMO_TIME_RECORDS: TimeRecord[] = [
  { id: 'time-1', label: 'Sample Time record', createdAt: new Date().toISOString() },
  { id: 'time-2', label: 'Time preview entry', createdAt: new Date().toISOString() },
];

export function listTimeRecords(): TimeRecord[] {
  return DEMO_TIME_RECORDS;
}
