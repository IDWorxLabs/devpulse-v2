/**
 * Validation Evidence Reuse Engine (VERE) V1 — on-disk evidence cache.
 *
 * The cache is a flat directory of small, inspectable JSON records, one per
 * (validatorName, validatorVersion, evidenceKind) slot, named by a deterministic hash of that
 * slot's identity (never by timestamp or random id). Records only ever contain fingerprints
 * (hashes), status, and short plain-text summaries — never file contents, never raw environment
 * values, never secrets.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sha256Hex } from './validation-evidence-fingerprint.js';
import type { ValidationEvidenceRecord } from './validation-evidence-types.js';

const CACHE_DIR_SEGMENTS = ['.aidevengine', 'validation-evidence-cache-v1'];

export function getEvidenceCacheDir(rootDir: string): string {
  return join(rootDir, ...CACHE_DIR_SEGMENTS);
}

/** Deterministic cache key: identical (name, version, kind) always yields the identical key. */
export function computeEvidenceCacheKey(validatorName: string, validatorVersion: string, evidenceKind: string): string {
  return sha256Hex(`${validatorName}::${validatorVersion}::${evidenceKind}`);
}

function recordFilePath(rootDir: string, cacheKey: string): string {
  return join(getEvidenceCacheDir(rootDir), `${cacheKey}.json`);
}

export function readEvidenceRecord(rootDir: string, cacheKey: string): ValidationEvidenceRecord | null {
  const filePath = recordFilePath(rootDir, cacheKey);
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    const raw = readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as ValidationEvidenceRecord;
  } catch {
    return null;
  }
}

export function writeEvidenceRecordToDisk(rootDir: string, cacheKey: string, record: ValidationEvidenceRecord): void {
  const dir = getEvidenceCacheDir(rootDir);
  mkdirSync(dir, { recursive: true });
  writeFileSync(recordFilePath(rootDir, cacheKey), JSON.stringify(record, null, 2), 'utf8');
}

export function deleteEvidenceRecordFromDisk(rootDir: string, cacheKey: string): void {
  const filePath = recordFilePath(rootDir, cacheKey);
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
}

/** Lists every currently cached evidence record — used for inspection and reporting only. */
export function listAllEvidenceRecords(rootDir: string): ValidationEvidenceRecord[] {
  const dir = getEvidenceCacheDir(rootDir);
  if (!existsSync(dir)) {
    return [];
  }
  const files = readdirSync(dir).filter((name) => name.endsWith('.json'));
  const records: ValidationEvidenceRecord[] = [];
  for (const file of files) {
    try {
      const raw = readFileSync(join(dir, file), 'utf8');
      records.push(JSON.parse(raw) as ValidationEvidenceRecord);
    } catch {
      // Corrupt or partially-written record — silently ignored, never treated as reusable.
    }
  }
  return records;
}

/** Removes every cached record for a given validator (all versions/kinds, or a specific kind). */
export function invalidateEvidenceOnDisk(rootDir: string, validatorName: string, evidenceKind?: string): number {
  const dir = getEvidenceCacheDir(rootDir);
  if (!existsSync(dir)) {
    return 0;
  }
  let removed = 0;
  for (const record of listAllEvidenceRecords(rootDir)) {
    if (record.validatorName !== validatorName) {
      continue;
    }
    if (evidenceKind && record.evidenceKind !== evidenceKind) {
      continue;
    }
    const cacheKey = computeEvidenceCacheKey(record.validatorName, record.validatorVersion, record.evidenceKind);
    deleteEvidenceRecordFromDisk(rootDir, cacheKey);
    removed += 1;
  }
  return removed;
}
