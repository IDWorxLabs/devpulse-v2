/**
 * Build History Integrity V1 — immutable build record recorder.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import { GENERATED_APP_MANIFEST_FILENAME } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import { PRODUCTION_VALIDATION_EVIDENCE_FILENAME } from '../production-validation/production-validation-types.js';
import type { ExecutionTraceEvent } from '../execution-trace/execution-trace-types.js';
import { buildAuditTimeline } from './build-history-audit-timeline.js';
import { computeBuildRecordHash, computeComparisonFingerprint } from './build-history-hash.js';
import { buildReplayMetadata } from './build-history-replay-metadata.js';
import { buildAuditReportMarkdown } from './build-history-report.js';
import {
  buildHistoryArtifactPaths,
  ensureRunDirectory,
  relativeHistoryPath,
  resolveUniqueRunId,
  writeImmutableFile,
  writeOptionalImmutableFile,
} from './build-history-store.js';
import type {
  BuildHistoryRecord,
  BuildHistoryRecordingResult,
  BuildHistoryValidationResults,
} from './build-history-types.js';
import { PRODUCTION_VALIDATION_SNAPSHOT_FILENAME } from './build-history-types.js';

function collectArtifactPaths(workspaceDir: string, recordDirRelative: string): string[] {
  const paths: string[] = [
    join(workspaceDir, GENERATED_APP_MANIFEST_FILENAME),
    join(workspaceDir, 'build-manifest.json'),
    join(workspaceDir, 'universal-feature-contract.json'),
    join(workspaceDir, 'blueprint-manifest.json'),
    join(workspaceDir, PRODUCTION_VALIDATION_EVIDENCE_FILENAME),
    recordDirRelative,
  ];
  return paths.filter((path) => existsSync(path)).map((path) => path.replace(/\\/g, '/'));
}

function buildValidationResults(manifest: GeneratedAppManifest): BuildHistoryValidationResults {
  return {
    readOnly: true,
    validationStatus: manifest.validationStatus,
    blueprintPurityStatus: manifest.blueprintPurityStatus,
    productionValidationStatus: manifest.productionValidationStatus,
    previewVerified: manifest.previewVerified,
    promptSpecificTermsPresent: manifest.promptSpecificTermsPresent,
    warnings: manifest.warnings,
    errors: manifest.errors,
  };
}

function collectFailureReasons(manifest: GeneratedAppManifest): string[] {
  return [
    ...(manifest.failureReason ? [manifest.failureReason] : []),
    ...manifest.productionValidationFailureReasons,
    ...manifest.blueprintPurityFailureReasons,
    ...manifest.errors,
  ].filter(Boolean);
}

export function recordBuildHistory(input: {
  projectRootDir: string;
  workspaceDir: string;
  manifest: GeneratedAppManifest;
  executionTraceEvents?: ExecutionTraceEvent[];
}): BuildHistoryRecordingResult {
  const { manifest, workspaceDir, projectRootDir } = input;
  const resolved = resolveUniqueRunId(projectRootDir, manifest.buildRunId);
  const runDir = ensureRunDirectory(projectRootDir, resolved.runId);
  const paths = buildHistoryArtifactPaths(runDir);
  const recordDirRelative = relativeHistoryPath(projectRootDir, runDir);

  const manifestPath = join(workspaceDir, GENERATED_APP_MANIFEST_FILENAME);
  const manifestSnapshotJson = JSON.stringify(manifest, null, 2) + '\n';
  writeImmutableFile(paths.manifestSnapshotPath, manifestSnapshotJson);

  const prodEvidencePath = join(workspaceDir, PRODUCTION_VALIDATION_EVIDENCE_FILENAME);
  let productionValidationSnapshotRelative: string | null = null;
  if (existsSync(prodEvidencePath)) {
    writeImmutableFile(
      paths.productionValidationSnapshotPath,
      readFileSync(prodEvidencePath, 'utf8'),
    );
    productionValidationSnapshotRelative = relativeHistoryPath(
      projectRootDir,
      paths.productionValidationSnapshotPath,
    );
  }

  const fileIndex = {
    readOnly: true,
    generatedFiles: manifest.generatedFiles,
    generatedDirectories: manifest.generatedDirectories,
    generatedFeatureModuleFiles: manifest.generatedFeatureModuleFiles,
    featureModuleDirectories: manifest.featureModuleDirectories,
    workspaceHash: manifest.workspaceHash,
    generatedFilesCount: manifest.generatedFilesCount,
    generatedDirectoriesCount: manifest.generatedDirectoriesCount,
  };
  const fileIndexSnapshotJson = JSON.stringify(fileIndex, null, 2) + '\n';
  writeImmutableFile(paths.fileIndexSnapshotPath, fileIndexSnapshotJson);

  const replayMetadata = buildReplayMetadata(manifest, workspaceDir);
  const replayMetadataJson = JSON.stringify(replayMetadata, null, 2) + '\n';
  writeImmutableFile(paths.replayMetadataPath, replayMetadataJson);

  const comparison = computeComparisonFingerprint(manifest);
  const auditTimeline = buildAuditTimeline({
    manifest,
    recordDirRelative,
    manifestSnapshotRelative: relativeHistoryPath(projectRootDir, paths.manifestSnapshotPath),
    productionValidationSnapshotRelative,
  });
  const auditTimelineJson = JSON.stringify(auditTimeline, null, 2) + '\n';
  writeImmutableFile(paths.auditTimelinePath, auditTimelineJson);

  const executionTraceSnapshot = input.executionTraceEvents ?? [];
  writeImmutableFile(
    paths.executionTraceSnapshotPath,
    JSON.stringify(executionTraceSnapshot, null, 2) + '\n',
  );

  const replayMetadataRelative = relativeHistoryPath(projectRootDir, paths.replayMetadataPath);
  const auditTimelineRelative = relativeHistoryPath(projectRootDir, paths.auditTimelinePath);

  const recordWithoutHash: Omit<BuildHistoryRecord, 'buildHistoryRecordHash'> = {
    readOnly: true,
    runId: resolved.runId,
    createdAt: manifest.completedAt ?? manifest.createdAt,
    prompt: manifest.prompt,
    selectedProfile: String(manifest.selectedProfile),
    appName: manifest.projectName,
    workspaceDir: workspaceDir.replace(/\\/g, '/'),
    manifestPath: manifestPath.replace(/\\/g, '/'),
    manifestHash: manifest.manifestHash,
    workspaceHash: manifest.workspaceHash,
    materializationHash: manifest.materializationHash,
    generatedFilesCount: manifest.generatedFilesCount,
    generatedDirectoriesCount: manifest.generatedDirectoriesCount,
    generatedFeatureModulesCount: manifest.generatedFeatureModulesCount,
    generatedRoutes: manifest.routes,
    generatedComponents: manifest.generatedFiles
      .filter((file) => file.category === 'Component')
      .map((file) => file.path),
    generatedServices: manifest.services,
    generatedModels: manifest.models,
    generatedStyles: manifest.styles,
    validationResults: buildValidationResults(manifest),
    productionValidationStatus: manifest.productionValidationStatus,
    previewVerified: manifest.previewVerified,
    previewUrl: manifest.previewUrl,
    artifactPaths: collectArtifactPaths(workspaceDir, recordDirRelative),
    failureReasons: collectFailureReasons(manifest),
    replayMetadataPath: replayMetadataRelative,
    comparisonFingerprint: comparison.fingerprint,
    auditTimelinePath: auditTimelineRelative,
    immutable: true,
    ...(resolved.deduplicated
      ? { deduplicatedRunId: true, originalRunId: resolved.originalRunId }
      : {}),
  };

  const buildHistoryRecordHash = computeBuildRecordHash(recordWithoutHash);
  const record: BuildHistoryRecord = { ...recordWithoutHash, buildHistoryRecordHash };

  const buildRecordJson = JSON.stringify(record, null, 2) + '\n';
  writeImmutableFile(paths.buildRecordPath, buildRecordJson);

  writeImmutableFile(
    paths.auditReportPath,
    buildAuditReportMarkdown(record, auditTimeline),
  );

  const evidence = {
    readOnly: true as const,
    buildHistoryRecorded: true,
    buildHistoryRunId: resolved.runId,
    buildHistoryRecordPath: recordDirRelative,
    buildHistoryRecordHash,
    buildHistoryImmutable: true,
    replayMetadataPath: replayMetadataRelative,
    auditTimelinePath: auditTimelineRelative,
    buildHistoryIntegrityStatus: 'PASS' as const,
    buildHistoryFailureReasons: record.failureReasons,
    deduplicatedRunId: resolved.deduplicated,
    productionValidationSnapshotRecorded: productionValidationSnapshotRelative !== null,
    recordedAt: new Date().toISOString(),
  };

  return {
    readOnly: true,
    evidence,
    record,
    auditTimeline,
    executionTraceSnapshot,
  };
}

export function patchBuildHistoryProductionSnapshot(input: {
  projectRootDir: string;
  workspaceDir: string;
  manifest: GeneratedAppManifest;
}): boolean {
  if (!input.manifest.buildHistoryRecorded || !input.manifest.buildHistoryRecordPath) {
    return false;
  }
  const runDir = join(input.projectRootDir, input.manifest.buildHistoryRecordPath);
  const prodEvidencePath = join(input.workspaceDir, PRODUCTION_VALIDATION_EVIDENCE_FILENAME);
  if (!existsSync(prodEvidencePath) || !existsSync(runDir)) {
    return false;
  }
  const snapshotPath = join(runDir, PRODUCTION_VALIDATION_SNAPSHOT_FILENAME);
  return writeOptionalImmutableFile(snapshotPath, readFileSync(prodEvidencePath, 'utf8'));
}
