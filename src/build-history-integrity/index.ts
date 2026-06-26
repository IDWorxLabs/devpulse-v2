/**
 * Build History Integrity V1 — public API.
 */

export {
  BUILD_HISTORY_INTEGRITY_V1_PASS_TOKEN,
  GENERATED_BUILD_HISTORY_DIR,
  BUILD_RECORD_FILENAME,
  MANIFEST_SNAPSHOT_FILENAME,
  PRODUCTION_VALIDATION_SNAPSHOT_FILENAME,
  EXECUTION_TRACE_SNAPSHOT_FILENAME,
  FILE_INDEX_SNAPSHOT_FILENAME,
  REPLAY_METADATA_FILENAME,
  AUDIT_TIMELINE_FILENAME,
  AUDIT_REPORT_FILENAME,
  BuildHistoryImmutabilityError,
  type BuildHistoryRecord,
  type BuildHistoryReplayMetadata,
  type BuildHistoryAuditTimelineEvent,
  type BuildHistoryComparisonFingerprint,
  type BuildHistoryIntegrityEvidence,
  type BuildHistoryRecordingResult,
  type BuildHistoryValidationResults,
} from './build-history-types.js';

export {
  hashString,
  computeBuildRecordHash,
  computeComparisonFingerprint,
  computeBuildHistoryRecordHash,
} from './build-history-hash.js';

export {
  buildHistoryRunDir,
  resolveUniqueRunId,
  ensureRunDirectory,
  writeImmutableFile,
  buildHistoryArtifactPaths,
  relativeHistoryPath,
} from './build-history-store.js';

export { buildReplayMetadata, PROFILE_FEATURE_MAP_VERSION } from './build-history-replay-metadata.js';
export { buildAuditTimeline } from './build-history-audit-timeline.js';
export { buildAuditReportMarkdown } from './build-history-report.js';
export { recordBuildHistory, patchBuildHistoryProductionSnapshot } from './build-history-recorder.js';
export {
  verifyBuildHistoryRecord,
  buildHistoryRecordExists,
  type BuildHistoryIntegrityCheck,
} from './build-history-integrity-validator.js';
export { applyBuildHistoryToManifest } from './build-history-manifest.js';
export { buildBuildHistoryTraceEvents, buildHistoryTraceTitles } from './build-history-trace-events.js';
