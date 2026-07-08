/** Service adapter for time-off — CRM */
import type { TimeOffRecord } from './time-off.types';

const DEMO_TIME_OFF_RECORDS: TimeOffRecord[] = [
  { id: 'time-off-1', label: 'Sample Time Off record', createdAt: new Date().toISOString() },
  { id: 'time-off-2', label: 'Time Off preview entry', createdAt: new Date().toISOString() },
];

export function listTimeOffRecords(): TimeOffRecord[] {
  return DEMO_TIME_OFF_RECORDS;
}
