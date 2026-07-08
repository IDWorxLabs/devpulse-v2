/** Service adapter for availability — reusable components where */
import type { AvailabilityRecord } from './availability.types';

const DEMO_AVAILABILITY_RECORDS: AvailabilityRecord[] = [
  { id: 'availability-1', label: 'Sample Availability record', createdAt: new Date().toISOString() },
  { id: 'availability-2', label: 'Availability preview entry', createdAt: new Date().toISOString() },
];

export function listAvailabilityRecords(): AvailabilityRecord[] {
  return DEMO_AVAILABILITY_RECORDS;
}
