/** Service adapter for income — Expense Tracking */
import type { IncomeRecord } from './income.types';

const DEMO_INCOME_RECORDS: IncomeRecord[] = [
  { id: 'income-1', label: 'Sample Income record', createdAt: new Date().toISOString() },
  { id: 'income-2', label: 'Income preview entry', createdAt: new Date().toISOString() },
];

export function listIncomeRecords(): IncomeRecord[] {
  return DEMO_INCOME_RECORDS;
}
