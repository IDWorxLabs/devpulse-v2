/** Service adapter for scanner — Qr Code Scanning */
import type { ScannerRecord } from './scanner.types';

const DEMO_SCANNER_RECORDS: ScannerRecord[] = [
  { id: 'scanner-1', label: 'Sample Scanner record', createdAt: new Date().toISOString() },
  { id: 'scanner-2', label: 'Scanner preview entry', createdAt: new Date().toISOString() },
];

export function listScannerRecords(): ScannerRecord[] {
  return DEMO_SCANNER_RECORDS;
}
