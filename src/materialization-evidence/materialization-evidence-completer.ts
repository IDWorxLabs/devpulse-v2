/**
 * Materialization Evidence Completer — delegates to forensic manifest lifecycle.
 */

import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import {
  GENERATED_APP_MANIFEST_FILENAME,
  type GeneratedAppManifest,
} from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import { discoverWorkspaceFiles } from './workspace-file-discovery-engine.js';
import {
  finalizeForensicManifestSuccess,
  readForensicManifest,
} from './forensic-manifest-lifecycle.js';
import type {
  MaterializationEvidenceCompletionInput,
  MaterializationEvidenceCompletionResult,
} from './materialization-evidence-types.js';
import { materializationQualityEvidenceForChat } from '../materialization-quality-score/materialization-quality-score-report.js';
import { buildFeatureContractRealityChatSummary } from '../feature-contract-reality/feature-contract-reality-report.js';
import { buildWorkspaceRealityAuditChatSummary } from '../workspace-reality-audit/workspace-reality-audit-report.js';
import { buildEvidenceDimensionReport } from '../feature-contract-reality/feature-reality-workspace-fallback-collector.js';

export function completeMaterializationEvidence(
  input: MaterializationEvidenceCompletionInput,
): MaterializationEvidenceCompletionResult {
  const writeStarted = performance.now();
  const discovery = discoverWorkspaceFiles(input.workspaceDir);
  const manifest = finalizeForensicManifestSuccess(input);
  const manifestWriteDurationMs = Math.round(performance.now() - writeStarted);

  return {
    readOnly: true,
    manifestWritten: true,
    manifestPath: join(input.workspaceDir, GENERATED_APP_MANIFEST_FILENAME),
    manifest,
    discovery,
    hashes: {
      workspaceHash: manifest.workspaceHash,
      manifestHash: manifest.manifestHash,
      materializationHash: manifest.materializationHash,
    },
    manifestWriteDurationMs,
  };
}

export function readCompletedGeneratedAppManifest(
  workspaceDir: string,
): GeneratedAppManifest | null {
  return readForensicManifest(workspaceDir);
}

export function materializationEvidenceSummaryForChat(
  manifest: GeneratedAppManifest | null,
): Record<string, unknown> | null {
  if (!manifest) return null;
  const failed =
    manifest.status === 'FAIL' || manifest.status === 'PARTIAL' || manifest.status === 'ABORTED';
  const moduleNames = manifest.featureModuleDetails.map((entry) => entry.name);
  return {
    readOnly: true,
    source: 'generated_app_manifest',
    status: manifest.status,
    currentStage: manifest.currentStage,
    validationStatus: manifest.validationStatus,
    generatedFilesCount: manifest.generatedFilesCount,
    lastGeneratedFileCount: manifest.lastGeneratedFileCount,
    generatedFeatureModulesCount: manifest.generatedFeatureModulesCount,
    generatedFeatureModuleFiles: manifest.generatedFeatureModuleFiles,
    featureModuleDirectories: manifest.featureModuleDirectories,
    featureModuleNames: moduleNames,
    modularFeatureMaterialization: manifest.featureModuleDetails.length > 0,
    modularFeatureSummary:
      moduleNames.length > 0
        ? `Separate modules for ${moduleNames.join(', ')}`
        : null,
    featureModuleDetails: manifest.featureModuleDetails,
    generatedRoutesCount: manifest.generatedRoutesCount,
    generatedComponentsCount: manifest.generatedComponentsCount,
    totalLinesGenerated: manifest.totalLinesGenerated,
    workspaceSizeBytes: manifest.workspaceSizeBytes,
    materializationDurationMs: manifest.materializationDurationMs,
    npmInstallDurationMs: manifest.npmInstallDurationMs,
    npmBuildDurationMs: manifest.npmBuildDurationMs,
    previewDurationMs: manifest.previewDurationMs,
    validationDurationMs: manifest.validationDurationMs,
    generationDurationMs: manifest.generationDurationMs,
    workspaceHash: manifest.workspaceHash || manifest.partialWorkspaceHash,
    materializationHash: manifest.materializationHash || manifest.partialMaterializationHash,
    partialWorkspaceHash: manifest.partialWorkspaceHash,
    failureStage: manifest.failureStage,
    failureReason: manifest.failureReason,
    failureMessage: manifest.failureMessage,
    lastSuccessfulStage: manifest.lastSuccessfulStage,
    failedCommand: manifest.failedCommand,
    exitCode: manifest.exitCode,
    stderrPreview: manifest.stderrPreview,
    stdoutPreview: manifest.stdoutPreview,
    stageUpdateCount: manifest.stageHistory.length,
    forensicManifestAvailable: true,
    buildFailed: failed,
    materializationQualityScore: manifest.materializationQualityScore,
    materializationQualityVerdict: manifest.materializationQualityVerdict,
    materializationQualityGaps: manifest.materializationQualityGaps,
    materializationQualityStrengths: manifest.materializationQualityStrengths,
    materializationQualityEvidence: materializationQualityEvidenceForChat(
      manifest.materializationQualityRecordedAt
        ? {
            readOnly: true,
            materializationQualityScore: manifest.materializationQualityScore,
            materializationQualityVerdict:
              manifest.materializationQualityVerdict === 'PENDING'
                ? 'NEEDS_WORK'
                : manifest.materializationQualityVerdict,
            materializationQualityCategories: manifest.materializationQualityCategories,
            materializationQualityGaps: manifest.materializationQualityGaps,
            materializationQualityStrengths: manifest.materializationQualityStrengths,
            materializationQualityCriticalFailures: manifest.materializationQualityCriticalFailures,
            materializationQualityScorePath: manifest.materializationQualityScorePath,
            materializationQualityPersistentScorePath: manifest.materializationQualityPersistentScorePath,
            materializationQualityRecordedAt: manifest.materializationQualityRecordedAt,
          }
        : null,
    ),
    featureContractRealityEvidence:
      manifest.featureContractRealityRecordedAt
        ? {
            readOnly: true,
            status: manifest.featureContractRealityStatus,
            overallScore: manifest.featureContractRealityScore,
            plannedFeatureCount: manifest.featureRealityRecords.length,
            provenFeatureCount: manifest.featureRealityRecords.filter((record) => record.score >= 90).length,
            featureRealityRecords: manifest.featureRealityRecords,
            failureReasons: manifest.featureRealityFailureReasons,
            artifactPath: manifest.featureContractRealityArtifactPath,
            chatSummary: buildFeatureContractRealityChatSummary({
              readOnly: true,
              status: manifest.featureContractRealityStatus === 'PENDING' ? 'PARTIAL' : manifest.featureContractRealityStatus,
              overallScore: manifest.featureContractRealityScore,
              plannedFeatureCount: manifest.featureRealityRecords.length,
              provenFeatureCount: manifest.featureRealityRecords.filter((record) => record.score >= 90).length,
              featureRealityRecords: manifest.featureRealityRecords,
              failureReasons: manifest.featureRealityFailureReasons,
              informationalFeatureIds: manifest.featureRealityRecords.filter((r) => r.informationalOnly).map((r) => r.featureId),
              interactiveFeatureIds: manifest.featureRealityRecords.filter((r) => !r.informationalOnly).map((r) => r.featureId),
              recordedAt: manifest.featureContractRealityRecordedAt ?? new Date().toISOString(),
              buildRunId: manifest.buildRunId,
              projectId: manifest.projectId,
              contractPath: null,
              artifactPath: manifest.featureContractRealityArtifactPath,
              persistentArtifactPath: manifest.featureContractRealityPersistentArtifactPath,
            }),
          }
        : null,
    workspaceRealityAuditEvidence:
      manifest.workspaceRealityRecordedAt
        ? {
            readOnly: true,
            status: manifest.workspaceRealityAuditStatus,
            score: manifest.workspaceRealityAuditScore,
            failureReasons: manifest.workspaceRealityFailureReasons,
            artifactPath: manifest.workspaceRealityAuditArtifactPath,
            reportPath: manifest.workspaceRealityReportPath,
            chatSummary: buildWorkspaceRealityAuditChatSummary({
              readOnly: true,
              status: manifest.workspaceRealityAuditStatus === 'PENDING' ? 'WARN' : manifest.workspaceRealityAuditStatus,
              score: manifest.workspaceRealityAuditScore,
              dimensions: [],
              orphanFiles: [],
              duplicateModules: [],
              missingImports: [],
              brokenRoutes: [],
              missingAssets: [],
              staleMetadata: [],
              temporaryArtifactLeaks: [],
              exportSafetyIssues: [],
              evidencePaths: [],
              failureReasons: manifest.workspaceRealityFailureReasons,
              auditedSourceRoot: manifest.persistentProjectSourceRoot ?? '',
              recordedAt: manifest.workspaceRealityRecordedAt ?? new Date().toISOString(),
              buildRunId: manifest.buildRunId,
              projectId: manifest.projectId,
              artifactPath: manifest.workspaceRealityAuditArtifactPath,
              reportPath: manifest.workspaceRealityReportPath,
              persistentArtifactPath: null,
              persistentReportPath: null,
            }),
          }
        : null,
    universalProductionProofEvidence:
      manifest.universalProductionProofRecordedAt
        ? {
            readOnly: true,
            runId: manifest.universalProductionProofRunId,
            status: manifest.universalProductionProofStatus,
            profileVerdict: manifest.universalProductionProofProfileVerdict,
            artifactPath: manifest.universalProductionProofArtifactPath,
            recordedAt: manifest.universalProductionProofRecordedAt,
          }
        : null,
    evidenceDimensionReport: buildEvidenceDimensionReport({
      promptFaithfulnessScore: manifest.promptFaithfulnessScore ?? null,
      promptFaithfulnessPassed: manifest.promptFaithfulnessStatus === 'PASS',
      workspaceMaterializationScore: manifest.materializationQualityScore ?? null,
      workspaceMaterializationPassed:
        manifest.status === 'PASS' || manifest.generatedFilesCount > 0,
      featureRealityStatus: manifest.featureContractRealityStatus,
      featureRealityScore: manifest.featureContractRealityScore ?? null,
      livePreviewRealityPassed:
        manifest.previewDurationMs > 0 ? manifest.validationStatus === 'PASS' : null,
      productionProofPassed:
        manifest.universalProductionProofStatus === 'PASS' ? true : null,
    }),
  };
}
