/** Service adapter for quick-phrases — LISA — Locked In Syndrome App */
import type { QuickPhrasesRecord } from './quick-phrases.types';

const DEMO_QUICK_PHRASES_RECORDS: QuickPhrasesRecord[] = [
  { id: 'quick-phrases-1', label: 'Sample Quick Phrases record', createdAt: new Date().toISOString() },
  { id: 'quick-phrases-2', label: 'Quick Phrases preview entry', createdAt: new Date().toISOString() },
];

export function listQuickPhrasesRecords(): QuickPhrasesRecord[] {
  return DEMO_QUICK_PHRASES_RECORDS;
}
