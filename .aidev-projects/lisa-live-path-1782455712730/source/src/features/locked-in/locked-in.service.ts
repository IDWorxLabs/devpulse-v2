/** Service adapter for locked-in — LISA — Locked In Syndrome App */
import type { LockedInRecord } from './locked-in.types';

const DEMO_LOCKED_IN_RECORDS: LockedInRecord[] = [
  { id: 'locked-in-1', label: 'Sample Locked In record', createdAt: new Date().toISOString() },
  { id: 'locked-in-2', label: 'Locked In preview entry', createdAt: new Date().toISOString() },
];

export function listLockedInRecords(): LockedInRecord[] {
  return DEMO_LOCKED_IN_RECORDS;
}
