/**
 * Build History Integrity V1 — manifest integration.
 */

import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import type { BuildHistoryIntegrityEvidence } from './build-history-types.js';

export function applyBuildHistoryToManifest(
  manifest: GeneratedAppManifest,
  evidence: BuildHistoryIntegrityEvidence,
): GeneratedAppManifest {
  return {
    ...manifest,
    buildHistoryRecorded: evidence.buildHistoryRecorded,
    buildHistoryRunId: evidence.buildHistoryRunId,
    buildHistoryRecordPath: evidence.buildHistoryRecordPath,
    buildHistoryRecordHash: evidence.buildHistoryRecordHash,
    buildHistoryImmutable: evidence.buildHistoryImmutable,
    replayMetadataPath: evidence.replayMetadataPath,
    auditTimelinePath: evidence.auditTimelinePath,
    buildHistoryIntegrityStatus: evidence.buildHistoryIntegrityStatus,
    buildHistoryFailureReasons: evidence.buildHistoryFailureReasons,
    buildHistoryDeduplicatedRunId: evidence.deduplicatedRunId,
    buildHistoryRecordedAt: evidence.recordedAt,
  };
}
