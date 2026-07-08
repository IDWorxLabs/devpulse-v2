/** Service adapter for styling — modern */
import type { StylingRecord } from './styling.types';

const DEMO_STYLING_RECORDS: StylingRecord[] = [
  { id: 'styling-1', label: 'Sample Styling record', createdAt: new Date().toISOString() },
  { id: 'styling-2', label: 'Styling preview entry', createdAt: new Date().toISOString() },
];

export function listStylingRecords(): StylingRecord[] {
  return DEMO_STYLING_RECORDS;
}
