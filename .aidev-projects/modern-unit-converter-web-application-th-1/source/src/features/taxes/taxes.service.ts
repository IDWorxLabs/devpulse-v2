/** Service adapter for taxes — reusable components where */
import type { TaxesRecord } from './taxes.types';

const DEMO_TAXES_RECORDS: TaxesRecord[] = [
  { id: 'taxes-1', label: 'Sample Taxes record', createdAt: new Date().toISOString() },
  { id: 'taxes-2', label: 'Taxes preview entry', createdAt: new Date().toISOString() },
];

export function listTaxesRecords(): TaxesRecord[] {
  return DEMO_TAXES_RECORDS;
}
