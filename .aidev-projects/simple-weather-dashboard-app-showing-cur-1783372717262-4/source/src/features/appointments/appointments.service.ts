/** Service adapter for appointments — modern */
import type { AppointmentsRecord } from './appointments.types';

const DEMO_APPOINTMENTS_RECORDS: AppointmentsRecord[] = [
  { id: 'appointments-1', label: 'Sample Appointments record', createdAt: new Date().toISOString() },
  { id: 'appointments-2', label: 'Appointments preview entry', createdAt: new Date().toISOString() },
];

export function listAppointmentsRecords(): AppointmentsRecord[] {
  return DEMO_APPOINTMENTS_RECORDS;
}
