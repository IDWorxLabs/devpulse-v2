/**
 * Materialization Evidence Completion V1 — public API.
 */

import { performance } from 'node:perf_hooks';

export {
  MATERIALIZATION_EVIDENCE_COMPLETION_V1_PASS_TOKEN,
  type GeneratedFileCategory,
  type GeneratedFileInventoryEntry,
  type MaterializationRuntimeTimings,
  type WorkspaceDiscoveryResult,
  type MaterializationHashBundle,
  type MaterializationEvidenceCompletionInput,
  type MaterializationEvidenceCompletionResult,
  type FounderTestMaterializationEvidenceAssessment,
} from './materialization-evidence-types.js';

export {
  classifyGeneratedFile,
  countByCategory,
} from './file-category-classifier.js';

export {
  discoverWorkspaceFiles,
  countWorkspaceFilesOnDisk,
  countWorkspaceDirectoriesOnDisk,
} from './workspace-file-discovery-engine.js';

export {
  computeWorkspaceHash,
  computeManifestHash,
  computeMaterializationHash,
  attachManifestHashes,
} from './materialization-hash-engine.js';

export {
  completeMaterializationEvidence,
  readCompletedGeneratedAppManifest,
  materializationEvidenceSummaryForChat,
} from './materialization-evidence-completer.js';

export {
  assessFounderTestMaterializationEvidence,
  buildFounderTestAssessment,
} from './founder-test-manifest-assessor.js';

export {
  isManifestEvidenceComplete,
  isForensicManifestPresent,
  listManifestPlaceholderFields,
} from '../universal-prompt-to-app-materialization/generated-app-manifest.js';

export {
  finalizeForensicManifestFailure,
  finalizeForensicManifestSuccess,
  initializeForensicManifest,
  updateForensicManifestStage,
  readForensicManifest,
  extractExecCommandFailure,
} from './forensic-manifest-lifecycle.js';

export {
  FAILED_BUILD_FORENSIC_MANIFEST_V1_PASS_TOKEN,
  type ForensicBuildStage,
  type ForensicManifestStatus,
  type ForensicManifestStageRecord,
  type ForensicCommandFailure,
  type ForensicManifestFailureInput,
  type ForensicManifestInitializeInput,
  type ForensicManifestStageUpdate,
} from './forensic-manifest-types.js';

export function createEmptyMaterializationTimings(): import('./materialization-evidence-types.js').MaterializationRuntimeTimings {
  return {
    planningDurationMs: 0,
    materializationDurationMs: 0,
    fileGenerationDurationMs: 0,
    validationDurationMs: 0,
    manifestWriteDurationMs: 0,
    npmInstallDurationMs: 0,
    npmBuildDurationMs: 0,
    previewDurationMs: 0,
    generationDurationMs: 0,
  };
}

export function roundDurationMs(started: number, ended: number = performance.now()): number {
  return Math.max(0, Math.round(ended - started));
}
