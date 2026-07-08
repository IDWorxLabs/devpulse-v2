/** Service adapter for modern — modern */
import type { ModernRecord } from './modern.types';

const DEMO_MODERN_RECORDS: ModernRecord[] = [
  { id: 'modern-1', label: 'Sample Modern record', createdAt: new Date().toISOString() },
  { id: 'modern-2', label: 'Modern preview entry', createdAt: new Date().toISOString() },
];

export function listModernRecords(): ModernRecord[] {
  return DEMO_MODERN_RECORDS;
}
