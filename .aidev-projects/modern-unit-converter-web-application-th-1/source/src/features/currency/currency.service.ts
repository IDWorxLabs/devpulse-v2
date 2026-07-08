/** Service adapter for currency — reusable components where */
import type { CurrencyRecord } from './currency.types';

const DEMO_CURRENCY_RECORDS: CurrencyRecord[] = [
  { id: 'currency-1', label: 'Sample Currency record', createdAt: new Date().toISOString() },
  { id: 'currency-2', label: 'Currency preview entry', createdAt: new Date().toISOString() },
];

export function listCurrencyRecords(): CurrencyRecord[] {
  return DEMO_CURRENCY_RECORDS;
}
