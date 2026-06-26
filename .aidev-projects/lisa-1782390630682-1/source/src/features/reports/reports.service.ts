/** Service adapter for reports — Lisa As A Real Modular */
import type { ReportsRecord } from './reports.types';

const DEMO_REPORTS_RECORDS: ReportsRecord[] = [
  { id: 'reports-1', label: 'Sample Reports record', createdAt: new Date().toISOString() },
  { id: 'reports-2', label: 'Reports preview entry', createdAt: new Date().toISOString() },
];

export function listReportsRecords(): ReportsRecord[] {
  return DEMO_REPORTS_RECORDS;
}
