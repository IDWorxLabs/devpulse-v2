/** Service adapter for haircut — modern */
import type { HaircutRecord } from './haircut.types';

const DEMO_HAIRCUT_RECORDS: HaircutRecord[] = [
  { id: 'haircut-1', label: 'Sample Haircut record', createdAt: new Date().toISOString() },
  { id: 'haircut-2', label: 'Haircut preview entry', createdAt: new Date().toISOString() },
];

export function listHaircutRecords(): HaircutRecord[] {
  return DEMO_HAIRCUT_RECORDS;
}
