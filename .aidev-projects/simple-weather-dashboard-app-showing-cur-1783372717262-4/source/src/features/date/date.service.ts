/** Service adapter for date — modern */
import type { DateRecord } from './date.types';

const DEMO_DATE_RECORDS: DateRecord[] = [
  { id: 'date-1', label: 'Sample Date record', createdAt: new Date().toISOString() },
  { id: 'date-2', label: 'Date preview entry', createdAt: new Date().toISOString() },
];

export function listDateRecords(): DateRecord[] {
  return DEMO_DATE_RECORDS;
}
