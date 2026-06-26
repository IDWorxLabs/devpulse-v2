/**
 * Build History Integrity V1 — hash and comparison fingerprints.
 */

import { createHash } from 'node:crypto';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import type { BuildHistoryComparisonFingerprint, BuildHistoryRecord } from './build-history-types.js';

export function hashString(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function computeBuildRecordHash(record: Omit<BuildHistoryRecord, 'buildHistoryRecordHash'>): string {
  const clone = { ...record };
  return hashString(JSON.stringify(clone));
}

export function computeComparisonFingerprint(manifest: GeneratedAppManifest): BuildHistoryComparisonFingerprint {
  const failureReasons = [
    ...(manifest.failureReason ? [manifest.failureReason] : []),
    ...manifest.productionValidationFailureReasons,
    ...manifest.blueprintPurityFailureReasons,
    ...manifest.errors,
  ].filter(Boolean);

  const promptHash = hashString(manifest.prompt.trim());
  const materializationScore =
    manifest.validationStatus === 'PASS' && manifest.productionValidationStatus === 'PASS'
      ? 100
      : manifest.validationStatus === 'PASS'
        ? 75
        : manifest.status === 'FAIL'
          ? 0
          : null;

  const payload = [
    promptHash,
    String(manifest.selectedProfile),
    String(manifest.generatedFilesCount),
    String(manifest.generatedFeatureModulesCount),
    String(manifest.routes.length),
    manifest.manifestHash,
    manifest.workspaceHash,
    manifest.productionValidationStatus,
    failureReasons.join('|'),
    materializationScore === null ? 'null' : String(materializationScore),
  ].join(':');

  return {
    readOnly: true,
    promptHash,
    profile: String(manifest.selectedProfile),
    generatedFilesCount: manifest.generatedFilesCount,
    featureModuleCount: manifest.generatedFeatureModulesCount,
    routeCount: manifest.routes.length,
    manifestHash: manifest.manifestHash,
    workspaceHash: manifest.workspaceHash,
    productionValidationStatus: manifest.productionValidationStatus,
    failureReasons,
    materializationScore,
    fingerprint: hashString(payload),
  };
}

export function computeBuildHistoryRecordHash(input: {
  buildRecordJson: string;
  manifestSnapshotJson: string;
  fileIndexSnapshotJson: string;
  replayMetadataJson: string;
  auditTimelineJson: string;
}): string {
  return hashString(
    [
      input.buildRecordJson,
      input.manifestSnapshotJson,
      input.fileIndexSnapshotJson,
      input.replayMetadataJson,
      input.auditTimelineJson,
    ].join('\n'),
  );
}
