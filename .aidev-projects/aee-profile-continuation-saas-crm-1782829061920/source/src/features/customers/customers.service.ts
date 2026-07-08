/** Service adapter for customers — CRM */
import type { CustomersRecord } from './customers.types';

const DEMO_CUSTOMERS_RECORDS: CustomersRecord[] = [
  { id: 'customers-1', label: 'Sample Customers record', createdAt: new Date().toISOString() },
  { id: 'customers-2', label: 'Customers preview entry', createdAt: new Date().toISOString() },
];

export function listCustomersRecords(): CustomersRecord[] {
  return DEMO_CUSTOMERS_RECORDS;
}
