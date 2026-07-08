/** Service adapter for staff — reusable components where */
import type { StaffRecord } from './staff.types';

const DEMO_STAFF_RECORDS: StaffRecord[] = [
  { id: 'staff-1', label: 'Sample Staff record', createdAt: new Date().toISOString() },
  { id: 'staff-2', label: 'Staff preview entry', createdAt: new Date().toISOString() },
];

export function listStaffRecords(): StaffRecord[] {
  return DEMO_STAFF_RECORDS;
}
