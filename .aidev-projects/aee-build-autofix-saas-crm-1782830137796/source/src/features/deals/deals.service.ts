/** Service adapter for deals — CRM */
import type { DealsRecord } from './deals.types';

const DEMO_DEALS_RECORDS: DealsRecord[] = [
  { id: 'deals-1', label: 'Sample Deals record', createdAt: new Date().toISOString() },
  { id: 'deals-2', label: 'Deals preview entry', createdAt: new Date().toISOString() },
];

export function listDealsRecords(): DealsRecord[] {
  return DEMO_DEALS_RECORDS;
}
