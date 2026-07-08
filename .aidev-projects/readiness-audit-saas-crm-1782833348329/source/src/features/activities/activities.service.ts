/** Service adapter for activities — Custom App */
import type { ActivitiesRecord } from './activities.types';

const DEMO_ACTIVITIES_RECORDS: ActivitiesRecord[] = [
  { id: 'activities-1', label: 'Sample Activities record', createdAt: new Date().toISOString() },
  { id: 'activities-2', label: 'Activities preview entry', createdAt: new Date().toISOString() },
];

export function listActivitiesRecords(): ActivitiesRecord[] {
  return DEMO_ACTIVITIES_RECORDS;
}
