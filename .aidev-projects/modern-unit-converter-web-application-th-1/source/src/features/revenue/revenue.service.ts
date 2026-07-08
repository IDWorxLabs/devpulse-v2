/** Service adapter for revenue — reusable components where */
import type { RevenueRecord } from './revenue.types';

const DEMO_REVENUE_RECORDS: RevenueRecord[] = [
  { id: 'revenue-1', label: 'Sample Revenue record', createdAt: new Date().toISOString() },
  { id: 'revenue-2', label: 'Revenue preview entry', createdAt: new Date().toISOString() },
];

export function listRevenueRecords(): RevenueRecord[] {
  return DEMO_REVENUE_RECORDS;
}
