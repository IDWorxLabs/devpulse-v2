/** Service adapter for services — modern */
import type { ServicesRecord } from './services.types';

const DEMO_SERVICES_RECORDS: ServicesRecord[] = [
  { id: 'services-1', label: 'Sample Services record', createdAt: new Date().toISOString() },
  { id: 'services-2', label: 'Services preview entry', createdAt: new Date().toISOString() },
];

export function listServicesRecords(): ServicesRecord[] {
  return DEMO_SERVICES_RECORDS;
}
