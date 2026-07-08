/** Service adapter for routines — modern */
import type { RoutinesRecord } from './routines.types';

const DEMO_ROUTINES_RECORDS: RoutinesRecord[] = [
  { id: 'routines-1', label: 'Sample Routines record', createdAt: new Date().toISOString() },
  { id: 'routines-2', label: 'Routines preview entry', createdAt: new Date().toISOString() },
];

export function listRoutinesRecords(): RoutinesRecord[] {
  return DEMO_ROUTINES_RECORDS;
}
