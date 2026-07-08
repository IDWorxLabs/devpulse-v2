/** Service adapter for customer — modern */
import type { CustomerRecord } from './customer.types';

const DEMO_CUSTOMER_RECORDS: CustomerRecord[] = [
  { id: 'customer-1', label: 'Sample Customer record', createdAt: new Date().toISOString() },
  { id: 'customer-2', label: 'Customer preview entry', createdAt: new Date().toISOString() },
];

export function listCustomerRecords(): CustomerRecord[] {
  return DEMO_CUSTOMER_RECORDS;
}
