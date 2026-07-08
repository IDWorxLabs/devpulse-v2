/** Service adapter for caregiver-dashboard — LISA — Locked In Syndrome App */
import type { CaregiverDashboardRecord } from './caregiver-dashboard.types';

const DEMO_CAREGIVER_DASHBOARD_RECORDS: CaregiverDashboardRecord[] = [
  { id: 'caregiver-dashboard-1', label: 'Sample Caregiver Dashboard record', createdAt: new Date().toISOString() },
  { id: 'caregiver-dashboard-2', label: 'Caregiver Dashboard preview entry', createdAt: new Date().toISOString() },
];

export function listCaregiverDashboardRecords(): CaregiverDashboardRecord[] {
  return DEMO_CAREGIVER_DASHBOARD_RECORDS;
}
