/** Service adapter for responsive — modern */
import type { ResponsiveRecord } from './responsive.types';

const DEMO_RESPONSIVE_RECORDS: ResponsiveRecord[] = [
  { id: 'responsive-1', label: 'Sample Responsive record', createdAt: new Date().toISOString() },
  { id: 'responsive-2', label: 'Responsive preview entry', createdAt: new Date().toISOString() },
];

export function listResponsiveRecords(): ResponsiveRecord[] {
  return DEMO_RESPONSIVE_RECORDS;
}
