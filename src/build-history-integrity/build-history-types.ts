/**
 * Build History Integrity V1 — evidence types.
 */

import type { ExecutionTraceEvent } from '../execution-trace/execution-trace-types.js';

export const BUILD_HISTORY_INTEGRITY_V1_PASS_TOKEN = 'BUILD_HISTORY_INTEGRITY_V1_PASS';

export const GENERATED_BUILD_HISTORY_DIR = '.generated-build-history';

export const BUILD_RECORD_FILENAME = 'build-record.json';
export const MANIFEST_SNAPSHOT_FILENAME = 'manifest.snapshot.json';
export const PRODUCTION_VALIDATION_SNAPSHOT_FILENAME = 'production-validation.snapshot.json';
export const EXECUTION_TRACE_SNAPSHOT_FILENAME = 'execution-trace.snapshot.json';
export const FILE_INDEX_SNAPSHOT_FILENAME = 'file-index.snapshot.json';
export const REPLAY_METADATA_FILENAME = 'replay-metadata.json';
export const AUDIT_TIMELINE_FILENAME = 'audit-timeline.json';
export const AUDIT_REPORT_FILENAME = 'audit-report.md';

export interface BuildHistoryValidationResults {
  readOnly: true;
  validationStatus: string;
  blueprintPurityStatus: string;
  productionValidationStatus: string;
  previewVerified: boolean;
  promptSpecificTermsPresent: boolean;
  warnings: string[];
  errors: string[];
}

export interface BuildHistoryRecord {
  readOnly: true;
  runId: string;
  createdAt: string;
  prompt: string;
  selectedProfile: string;
  appName: string;
  workspaceDir: string;
  manifestPath: string;
  manifestHash: string;
  workspaceHash: string;
  materializationHash: string;
  generatedFilesCount: number;
  generatedDirectoriesCount: number;
  generatedFeatureModulesCount: number;
  generatedRoutes: string[];
  generatedComponents: string[];
  generatedServices: string[];
  generatedModels: string[];
  generatedStyles: string[];
  validationResults: BuildHistoryValidationResults;
  productionValidationStatus: string;
  previewVerified: boolean;
  previewUrl: string | null;
  artifactPaths: string[];
  failureReasons: string[];
  replayMetadataPath: string;
  comparisonFingerprint: string;
  auditTimelinePath: string;
  buildHistoryRecordHash: string;
  immutable: true;
  deduplicatedRunId?: boolean;
  originalRunId?: string;
}

export interface BuildHistoryReplayMetadata {
  readOnly: true;
  originalPrompt: string;
  selectedProfile: string;
  generationInputs: {
    projectId: string;
    buildRunId: string;
    expectedAppType: string;
    featureModules: string[];
    routes: string[];
    fallbackUsed: boolean;
  };
  featureContractSummary: {
    featureModuleCount: number;
    featureModuleIds: string[];
    routes: string[];
  };
  profileFeatureMapVersion: string;
  blueprintVersion: string;
  generatorVersion: string;
  dependencySnapshot: {
    runtime: string;
    packageManager: string;
    note: string;
  };
  validationCommands: string[];
  expectedArtifacts: string[];
  replayInstructions: string[];
}

export interface BuildHistoryAuditTimelineEvent {
  readOnly: true;
  eventId: string;
  timestamp: string;
  stage: string;
  status: 'PASS' | 'FAIL' | 'PENDING' | 'INFO';
  evidencePath: string | null;
  evidenceSummary: string;
}

export interface BuildHistoryComparisonFingerprint {
  readOnly: true;
  promptHash: string;
  profile: string;
  generatedFilesCount: number;
  featureModuleCount: number;
  routeCount: number;
  manifestHash: string;
  workspaceHash: string;
  productionValidationStatus: string;
  failureReasons: string[];
  materializationScore: number | null;
  fingerprint: string;
}

export interface BuildHistoryIntegrityEvidence {
  readOnly: true;
  buildHistoryRecorded: boolean;
  buildHistoryRunId: string;
  buildHistoryRecordPath: string;
  buildHistoryRecordHash: string;
  buildHistoryImmutable: boolean;
  replayMetadataPath: string;
  auditTimelinePath: string;
  buildHistoryIntegrityStatus: 'PASS' | 'FAIL';
  buildHistoryFailureReasons: string[];
  deduplicatedRunId: boolean;
  productionValidationSnapshotRecorded: boolean;
  recordedAt: string;
}

export interface BuildHistoryRecordingResult {
  readOnly: true;
  evidence: BuildHistoryIntegrityEvidence;
  record: BuildHistoryRecord;
  auditTimeline: BuildHistoryAuditTimelineEvent[];
  executionTraceSnapshot: ExecutionTraceEvent[];
}

export class BuildHistoryImmutabilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BuildHistoryImmutabilityError';
  }
}
