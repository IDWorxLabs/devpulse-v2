/** Service adapter for charts — modern */
import type { ChartsRecord } from './charts.types';

const DEMO_CHARTS_RECORDS: ChartsRecord[] = [
  { id: 'charts-1', label: 'Sample Charts record', createdAt: new Date().toISOString() },
  { id: 'charts-2', label: 'Charts preview entry', createdAt: new Date().toISOString() },
];

export function listChartsRecords(): ChartsRecord[] {
  return DEMO_CHARTS_RECORDS;
}
