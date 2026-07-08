/** Service adapter for filter-ui — LISA — Locked In Syndrome App */
import type { FilterUiRecord } from './filter-ui.types';

const DEMO_FILTER_UI_RECORDS: FilterUiRecord[] = [
  { id: 'filter-ui-1', label: 'Sample Filter Ui record', createdAt: new Date().toISOString() },
  { id: 'filter-ui-2', label: 'Filter Ui preview entry', createdAt: new Date().toISOString() },
];

export function listFilterUiRecords(): FilterUiRecord[] {
  return DEMO_FILTER_UI_RECORDS;
}
