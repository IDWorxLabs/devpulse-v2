/**
 * Universal Data Export Pack — Basic testable runtime (domain-neutral).
 */

export type ExportRecord = Readonly<Record<string, string | number | boolean | null>>;

export interface ExportResult {
  readonly format: 'json' | 'csv';
  readonly content: string;
  readonly recordCount: number;
  readonly filename: string;
  readonly approvedFields: readonly string[];
}

export function filterApprovedFields(record: ExportRecord, approvedFields: readonly string[]): ExportRecord {
  const out: Record<string, string | number | boolean | null> = {};
  for (const field of approvedFields) {
    if (field in record) out[field] = record[field] ?? null;
  }
  return out;
}

export function escapeCsvValue(value: string | number | boolean | null): string {
  if (value === null) return '';
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function exportRecordsToJson(
  records: readonly ExportRecord[],
  approvedFields: readonly string[],
  filenameStem: string,
  emptyPolicy: 'RETURN_EMPTY' | 'FAIL' = 'RETURN_EMPTY',
): ExportResult {
  if (records.length === 0 && emptyPolicy === 'FAIL') {
    throw new Error('Cannot export empty collection under FAIL policy');
  }
  const filtered = records.map((r) => filterApprovedFields(r, approvedFields));
  return {
    format: 'json',
    content: JSON.stringify(filtered, null, 2),
    recordCount: filtered.length,
    filename: `${filenameStem}.json`,
    approvedFields,
  };
}

export function exportRecordsToCsv(
  records: readonly ExportRecord[],
  approvedFields: readonly string[],
  filenameStem: string,
  emptyPolicy: 'RETURN_EMPTY' | 'FAIL' = 'RETURN_EMPTY',
): ExportResult {
  if (records.length === 0 && emptyPolicy === 'FAIL') {
    throw new Error('Cannot export empty collection under FAIL policy');
  }
  const filtered = records.map((r) => filterApprovedFields(r, approvedFields));
  const header = approvedFields.join(',');
  const rows = filtered.map((record) => approvedFields.map((f) => escapeCsvValue(record[f] ?? null)).join(','));
  return {
    format: 'csv',
    content: [header, ...rows].join('\n'),
    recordCount: filtered.length,
    filename: `${filenameStem}.csv`,
    approvedFields,
  };
}

export function exportSelectedRecords(
  allRecords: readonly ExportRecord[],
  selectedIds: readonly string[],
  approvedFields: readonly string[],
  format: 'json' | 'csv',
  filenameStem: string,
): ExportResult {
  const selected = allRecords.filter((r) => selectedIds.includes(String(r.id ?? '')));
  return format === 'json'
    ? exportRecordsToJson(selected, approvedFields, filenameStem)
    : exportRecordsToCsv(selected, approvedFields, filenameStem);
}

export function exportFilteredCollection(
  allRecords: readonly ExportRecord[],
  predicate: (record: ExportRecord) => boolean,
  approvedFields: readonly string[],
  format: 'json' | 'csv',
  filenameStem: string,
): ExportResult {
  const filtered = allRecords.filter(predicate);
  return format === 'json'
    ? exportRecordsToJson(filtered, approvedFields, filenameStem)
    : exportRecordsToCsv(filtered, approvedFields, filenameStem);
}

/** PDF/Excel are explicitly blocked in the basic pack. */
export function isAdvancedBinaryExportSupported(): boolean {
  return false;
}
