/**
 * Build History Integrity V1 — immutable on-disk store.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  AUDIT_REPORT_FILENAME,
  AUDIT_TIMELINE_FILENAME,
  BUILD_RECORD_FILENAME,
  EXECUTION_TRACE_SNAPSHOT_FILENAME,
  FILE_INDEX_SNAPSHOT_FILENAME,
  GENERATED_BUILD_HISTORY_DIR,
  MANIFEST_SNAPSHOT_FILENAME,
  PRODUCTION_VALIDATION_SNAPSHOT_FILENAME,
  REPLAY_METADATA_FILENAME,
  BuildHistoryImmutabilityError,
} from './build-history-types.js';

export function buildHistoryRunDir(projectRootDir: string, runId: string): string {
  return join(projectRootDir, GENERATED_BUILD_HISTORY_DIR, runId);
}

export function resolveUniqueRunId(
  projectRootDir: string,
  runId: string,
): { runId: string; deduplicated: boolean; originalRunId?: string } {
  const initialDir = buildHistoryRunDir(projectRootDir, runId);
  if (!existsSync(initialDir)) {
    return { runId, deduplicated: false };
  }
  const deduped = `${runId}-dup-${Date.now()}`;
  return { runId: deduped, deduplicated: true, originalRunId: runId };
}

export function ensureRunDirectory(projectRootDir: string, runId: string): string {
  const dir = buildHistoryRunDir(projectRootDir, runId);
  if (existsSync(dir)) {
    throw new BuildHistoryImmutabilityError(
      `Build history run directory already exists and is immutable: ${dir}`,
    );
  }
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function writeImmutableFile(absolutePath: string, content: string): void {
  if (existsSync(absolutePath)) {
    throw new BuildHistoryImmutabilityError(`Refusing to overwrite immutable artifact: ${absolutePath}`);
  }
  writeFileSync(absolutePath, content, 'utf8');
}

export function writeOptionalImmutableFile(absolutePath: string, content: string): boolean {
  if (existsSync(absolutePath)) return false;
  writeFileSync(absolutePath, content, 'utf8');
  return true;
}

export function buildHistoryArtifactPaths(runDir: string): {
  buildRecordPath: string;
  manifestSnapshotPath: string;
  productionValidationSnapshotPath: string;
  executionTraceSnapshotPath: string;
  fileIndexSnapshotPath: string;
  replayMetadataPath: string;
  auditTimelinePath: string;
  auditReportPath: string;
} {
  return {
    buildRecordPath: join(runDir, BUILD_RECORD_FILENAME),
    manifestSnapshotPath: join(runDir, MANIFEST_SNAPSHOT_FILENAME),
    productionValidationSnapshotPath: join(runDir, PRODUCTION_VALIDATION_SNAPSHOT_FILENAME),
    executionTraceSnapshotPath: join(runDir, EXECUTION_TRACE_SNAPSHOT_FILENAME),
    fileIndexSnapshotPath: join(runDir, FILE_INDEX_SNAPSHOT_FILENAME),
    replayMetadataPath: join(runDir, REPLAY_METADATA_FILENAME),
    auditTimelinePath: join(runDir, AUDIT_TIMELINE_FILENAME),
    auditReportPath: join(runDir, AUDIT_REPORT_FILENAME),
  };
}

export function relativeHistoryPath(projectRootDir: string, absolutePath: string): string {
  const root = projectRootDir.replace(/\\/g, '/');
  const abs = absolutePath.replace(/\\/g, '/');
  if (abs.startsWith(root)) {
    return abs.slice(root.length + 1);
  }
  return abs;
}
