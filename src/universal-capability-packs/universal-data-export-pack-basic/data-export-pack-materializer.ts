/**
 * Universal Data Export Pack — Basic workspace materializer.
 */

import type { GeneratedWorkspaceFile } from '../../code-generation-engine/code-generation-engine-types.js';
import { UNIVERSAL_DATA_EXPORT_PACK_BASIC_DESCRIPTOR } from './data-export-pack-descriptor.js';

export function materializeDataExportPackBasic(configuration: Readonly<Record<string, unknown>>): GeneratedWorkspaceFile[] {
  const approvedFields = (configuration.approvedFields as string[]) ?? ['id', 'label', 'createdAt', 'updatedAt'];
  const filenameStem = String(configuration.filenameStem ?? 'export');
  const emptyCollectionPolicy = String(configuration.emptyCollectionPolicy ?? 'RETURN_EMPTY');

  return [
    {
      relativePath: 'src/universal-capability-packs/data-export-basic/data-export-runtime.ts',
      content: generateSelfContainedExportRuntime(approvedFields, filenameStem, emptyCollectionPolicy),
    },
    {
      relativePath: 'src/universal-capability-packs/data-export-basic/data-export-pack.json',
      content: `${JSON.stringify({ packId: UNIVERSAL_DATA_EXPORT_PACK_BASIC_DESCRIPTOR.packId, version: UNIVERSAL_DATA_EXPORT_PACK_BASIC_DESCRIPTOR.packVersion, approvedFields, filenameStem }, null, 2)}\n`,
    },
  ];
}

function generateSelfContainedExportRuntime(approvedFields: string[], filenameStem: string, emptyPolicy: string): string {
  return `/** Universal Data Export Pack — Basic runtime — self-contained generated artifact */
export type ExportRecord = Readonly<Record<string, string | number | boolean | null>>;

const APPROVED_FIELDS: readonly string[] = ${JSON.stringify(approvedFields)};
const FILENAME_STEM = '${filenameStem}';
const EMPTY_POLICY = '${emptyPolicy}';

function filterApproved(record: ExportRecord): ExportRecord {
  const out: Record<string, string | number | boolean | null> = {};
  for (const field of APPROVED_FIELDS) {
    if (field in record) out[field] = record[field] ?? null;
  }
  return out;
}

function escapeCsv(value: string | number | boolean | null): string {
  if (value === null) return '';
  const text = String(value);
  if (/[",\\n\\r]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
  return text;
}

export function exportToJson(records: ExportRecord[]): { content: string; recordCount: number; filename: string } {
  if (records.length === 0 && EMPTY_POLICY === 'FAIL') throw new Error('Cannot export empty collection');
  const filtered = records.map(filterApproved);
  return { content: JSON.stringify(filtered, null, 2), recordCount: filtered.length, filename: FILENAME_STEM + '.json' };
}

export function exportToCsv(records: ExportRecord[]): { content: string; recordCount: number; filename: string } {
  if (records.length === 0 && EMPTY_POLICY === 'FAIL') throw new Error('Cannot export empty collection');
  const filtered = records.map(filterApproved);
  const header = APPROVED_FIELDS.join(',');
  const rows = filtered.map((r) => APPROVED_FIELDS.map((f) => escapeCsv(r[f] ?? null)).join(','));
  return { content: [header, ...rows].join('\\n'), recordCount: filtered.length, filename: FILENAME_STEM + '.csv' };
}

export function exportSelected(records: ExportRecord[], selectedIds: string[], format: 'json' | 'csv') {
  const selected = records.filter((r) => selectedIds.includes(String(r.id ?? '')));
  return format === 'json' ? exportToJson(selected) : exportToCsv(selected);
}

export function exportFiltered(records: ExportRecord[], predicate: (r: ExportRecord) => boolean, format: 'json' | 'csv') {
  const filtered = records.filter(predicate);
  return format === 'json' ? exportToJson(filtered) : exportToCsv(filtered);
}

export function isAdvancedBinaryExportSupported(): boolean {
  return false;
}

export const EXPORT_APPROVED_FIELDS = APPROVED_FIELDS;
`;
}
