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
  return {
    readOnly: true,
    source: 'generated_app_manifest',
    status: manifest.status,
    currentStage: manifest.currentStage,
    validationStatus: manifest.validationStatus,
    generatedFilesCount: manifest.generatedFilesCount,
    lastGeneratedFileCount: manifest.lastGeneratedFileCount,
    generatedFeatureModulesCount: manifest.generatedFeatureModulesCount,
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
  };
}
