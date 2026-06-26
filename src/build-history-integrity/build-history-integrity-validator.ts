/**
 * Build History Integrity V1 — on-disk record validator.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import { GENERATED_APP_MANIFEST_FILENAME } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import { computeBuildRecordHash } from './build-history-hash.js';
import { buildHistoryRunDir } from './build-history-store.js';
import {
  AUDIT_REPORT_FILENAME,
  AUDIT_TIMELINE_FILENAME,
  BUILD_RECORD_FILENAME,
  EXECUTION_TRACE_SNAPSHOT_FILENAME,
  FILE_INDEX_SNAPSHOT_FILENAME,
  MANIFEST_SNAPSHOT_FILENAME,
  PRODUCTION_VALIDATION_SNAPSHOT_FILENAME,
  REPLAY_METADATA_FILENAME,
  type BuildHistoryRecord,
} from './build-history-types.js';

export interface BuildHistoryIntegrityCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export function verifyBuildHistoryRecord(input: {
  projectRootDir: string;
  runId: string;
  manifest: GeneratedAppManifest;
}): BuildHistoryIntegrityCheck[] {
  const checks: BuildHistoryIntegrityCheck[] = [];
  const runDir = buildHistoryRunDir(input.projectRootDir, input.runId);

  function check(name: string, condition: boolean, detail: string): void {
    checks.push({ name, passed: condition, detail });
  }

  check('run directory exists', existsSync(runDir), runDir);

  const buildRecordPath = join(runDir, BUILD_RECORD_FILENAME);
  check('build-record.json exists', existsSync(buildRecordPath), BUILD_RECORD_FILENAME);

  if (!existsSync(buildRecordPath)) {
    return checks;
  }

  const record = JSON.parse(readFileSync(buildRecordPath, 'utf8')) as BuildHistoryRecord;
  check('record immutable flag', record.immutable === true, String(record.immutable));
  check('record runId matches', record.runId === input.runId, `${record.runId} vs ${input.runId}`);
  check(
    'manifest links to build history',
    input.manifest.buildHistoryRecorded === true &&
      input.manifest.buildHistoryRunId === input.runId,
    `${input.manifest.buildHistoryRunId}`,
  );
  check(
    'build record links to manifest hash',
    record.manifestHash === input.manifest.manifestHash,
    `${record.manifestHash.slice(0, 12)}…`,
  );
  check(
    'build record links to workspace hash',
    record.workspaceHash === input.manifest.workspaceHash,
    `${record.workspaceHash.slice(0, 12)}…`,
  );
  check(
    'comparison fingerprint present',
    typeof record.comparisonFingerprint === 'string' && record.comparisonFingerprint.length > 0,
    record.comparisonFingerprint.slice(0, 12),
  );

  const { buildHistoryRecordHash: storedHash, ...recordWithoutHash } = record;
  const recomputedHash = computeBuildRecordHash(recordWithoutHash);
  check(
    'build record hash stable',
    recomputedHash === storedHash,
    storedHash.slice(0, 12),
  );

  check(
    'manifest snapshot exists',
    existsSync(join(runDir, MANIFEST_SNAPSHOT_FILENAME)),
    MANIFEST_SNAPSHOT_FILENAME,
  );
  check(
    'file index snapshot exists',
    existsSync(join(runDir, FILE_INDEX_SNAPSHOT_FILENAME)),
    FILE_INDEX_SNAPSHOT_FILENAME,
  );
  check(
    'replay metadata exists',
    existsSync(join(runDir, REPLAY_METADATA_FILENAME)),
    REPLAY_METADATA_FILENAME,
  );
  check(
    'audit timeline exists',
    existsSync(join(runDir, AUDIT_TIMELINE_FILENAME)),
    AUDIT_TIMELINE_FILENAME,
  );
  check(
    'execution trace snapshot exists',
    existsSync(join(runDir, EXECUTION_TRACE_SNAPSHOT_FILENAME)),
    EXECUTION_TRACE_SNAPSHOT_FILENAME,
  );
  check(
    'audit report exists',
    existsSync(join(runDir, AUDIT_REPORT_FILENAME)),
    AUDIT_REPORT_FILENAME,
  );

  if (input.manifest.productionValidationStatus !== 'PENDING') {
    check(
      'production validation snapshot when prod validation ran',
      existsSync(join(runDir, PRODUCTION_VALIDATION_SNAPSHOT_FILENAME)),
      PRODUCTION_VALIDATION_SNAPSHOT_FILENAME,
    );
  }

  if (input.manifest.status === 'FAIL' || input.manifest.failureReason) {
    check(
      'failure build records failure reasons',
      record.failureReasons.length > 0,
      record.failureReasons.join('; ').slice(0, 80),
    );
  }

  const manifestPath = join(input.manifest.workspacePath ?? '', GENERATED_APP_MANIFEST_FILENAME);
  check(
    'manifest path on disk matches record',
    record.manifestPath.replace(/\\/g, '/').endsWith(GENERATED_APP_MANIFEST_FILENAME),
    manifestPath,
  );

  return checks;
}

export function buildHistoryRecordExists(projectRootDir: string, runId: string): boolean {
  return existsSync(join(buildHistoryRunDir(projectRootDir, runId), BUILD_RECORD_FILENAME));
}
