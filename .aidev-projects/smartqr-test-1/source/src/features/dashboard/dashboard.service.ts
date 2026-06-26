/** Service adapter for dashboard — Qr Code Scanning */
import type { DashboardRecord } from './dashboard.types';

const DEMO_DASHBOARD_RECORDS: DashboardRecord[] = [
  { id: 'dashboard-1', label: 'Sample Dashboard record', createdAt: new Date().toISOString() },
  { id: 'dashboard-2', label: 'Dashboard preview entry', createdAt: new Date().toISOString() },
];

export function listDashboardRecords(): DashboardRecord[] {
  return DEMO_DASHBOARD_RECORDS;
}
