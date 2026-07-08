/** Service adapter for payments — Custom App */
import type { PaymentsRecord } from './payments.types';

const DEMO_PAYMENTS_RECORDS: PaymentsRecord[] = [
  { id: 'payments-1', label: 'Sample Payments record', createdAt: new Date().toISOString() },
  { id: 'payments-2', label: 'Payments preview entry', createdAt: new Date().toISOString() },
];

export function listPaymentsRecords(): PaymentsRecord[] {
  return DEMO_PAYMENTS_RECORDS;
}
