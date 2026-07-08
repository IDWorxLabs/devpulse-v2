/** Service adapter for wash — modern */
import type { WashRecord } from './wash.types';

const DEMO_WASH_RECORDS: WashRecord[] = [
  { id: 'wash-1', label: 'Sample Wash record', createdAt: new Date().toISOString() },
  { id: 'wash-2', label: 'Wash preview entry', createdAt: new Date().toISOString() },
];

export function listWashRecords(): WashRecord[] {
  return DEMO_WASH_RECORDS;
}
