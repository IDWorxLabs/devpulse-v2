/** Service adapter for analytics — modern */
import type { AnalyticsRecord } from './analytics.types';

const DEMO_ANALYTICS_RECORDS: AnalyticsRecord[] = [
  { id: 'analytics-1', label: 'Sample Analytics record', createdAt: new Date().toISOString() },
  { id: 'analytics-2', label: 'Analytics preview entry', createdAt: new Date().toISOString() },
];

export function listAnalyticsRecords(): AnalyticsRecord[] {
  return DEMO_ANALYTICS_RECORDS;
}
