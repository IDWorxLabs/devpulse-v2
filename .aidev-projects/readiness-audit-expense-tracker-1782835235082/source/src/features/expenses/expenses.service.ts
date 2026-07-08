/** Service adapter for expenses — Expense Tracker */
import type { ExpensesRecord } from './expenses.types';

const DEMO_EXPENSES_RECORDS: ExpensesRecord[] = [
  { id: 'expenses-1', label: 'Sample Expenses record', createdAt: new Date().toISOString() },
  { id: 'expenses-2', label: 'Expenses preview entry', createdAt: new Date().toISOString() },
];

export function listExpensesRecords(): ExpensesRecord[] {
  return DEMO_EXPENSES_RECORDS;
}
