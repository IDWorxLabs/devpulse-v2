/** Service adapter for reservations — reusable components where */
import type { ReservationsRecord } from './reservations.types';

const DEMO_RESERVATIONS_RECORDS: ReservationsRecord[] = [
  { id: 'reservations-1', label: 'Sample Reservations record', createdAt: new Date().toISOString() },
  { id: 'reservations-2', label: 'Reservations preview entry', createdAt: new Date().toISOString() },
];

export function listReservationsRecords(): ReservationsRecord[] {
  return DEMO_RESERVATIONS_RECORDS;
}
