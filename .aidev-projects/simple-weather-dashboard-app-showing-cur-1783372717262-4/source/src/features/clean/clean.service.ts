/** Service adapter for clean — modern */
import type { CleanRecord } from './clean.types';

const DEMO_CLEAN_RECORDS: CleanRecord[] = [
  { id: 'clean-1', label: 'Sample Clean record', createdAt: new Date().toISOString() },
  { id: 'clean-2', label: 'Clean preview entry', createdAt: new Date().toISOString() },
];

export function listCleanRecords(): CleanRecord[] {
  return DEMO_CLEAN_RECORDS;
}
