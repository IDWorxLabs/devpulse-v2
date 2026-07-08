/** Service adapter for categories — Expense Tracker */
import type { CategoriesRecord } from './categories.types';

const DEMO_CATEGORIES_RECORDS: CategoriesRecord[] = [
  { id: 'categories-1', label: 'Sample Categories record', createdAt: new Date().toISOString() },
  { id: 'categories-2', label: 'Categories preview entry', createdAt: new Date().toISOString() },
];

export function listCategoriesRecords(): CategoriesRecord[] {
  return DEMO_CATEGORIES_RECORDS;
}
