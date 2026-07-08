/** Service adapter for csv-export — modern */
import type { CsvExportRecord } from './csv-export.types';

const DEMO_CSV_EXPORT_RECORDS: CsvExportRecord[] = [
  { id: 'csv-export-1', label: 'Sample Csv Export record', createdAt: new Date().toISOString() },
  { id: 'csv-export-2', label: 'Csv Export preview entry', createdAt: new Date().toISOString() },
];

export function listCsvExportRecords(): CsvExportRecord[] {
  return DEMO_CSV_EXPORT_RECORDS;
}
