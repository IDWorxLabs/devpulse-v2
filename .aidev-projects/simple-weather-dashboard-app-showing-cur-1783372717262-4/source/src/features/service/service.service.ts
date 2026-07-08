/** Service adapter for service — modern */
import type { ServiceRecord } from './service.types';

const DEMO_SERVICE_RECORDS: ServiceRecord[] = [
  { id: 'service-1', label: 'Sample Service record', createdAt: new Date().toISOString() },
  { id: 'service-2', label: 'Service preview entry', createdAt: new Date().toISOString() },
];

export function listServiceRecords(): ServiceRecord[] {
  return DEMO_SERVICE_RECORDS;
}
