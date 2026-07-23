/**
 * Failed Build Forensic Manifest V1 — incremental lifecycle writer.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import {
  GENERATED_APP_MANIFEST_FILENAME,
  buildInitialGeneratedAppManifest,
  serializeGeneratedAppManifest,
  type GeneratedAppManifest,
} from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import { partitionProductAndInfrastructureModules } from '../contract-to-module-traceability/contract-to-module-infrastructure-registry.js';
import { discoverWorkspaceFiles } from './workspace-file-discovery-engine.js';
import { attachManifestHashes } from './materialization-hash-engine.js';
import { stampPreviewWorkspaceIdentity } from '../end-to-end-build-reality-engine-v1/preview-workspace-identity.js';
import type { GeneratedFileCategory } from './materialization-evidence-types.js';
import type {
  ForensicBuildStage,
  ForensicCommandFailure,
  ForensicManifestFailureInput,
  ForensicManifestInitializeInput,
  ForensicManifestStageRecord,
  ForensicManifestStageUpdate,
  ForensicManifestStatus,
} from './forensic-manifest-types.js';
import type { MaterializationEvidenceCompletionInput } from './materialization-evidence-types.js';
import {
  applyBlueprintPurityToManifest,
  buildBlueprintPurityEvidence,
  scanGeneratedWorkspaceShell,
  verifyGeneratedAppDomainBoundary,
} from '../blueprint-purity/index.js';
import {
  applyBuildHistoryToManifest,
  recordBuildHistory,
} from '../build-history-integrity/index.js';
import {
  applyPersistentProjectRealityToManifest,
  buildFailurePersistentProjectEvidence,
  recordPersistentProjectReality,
} from '../persistent-project-reality/index.js';
import {
  applyMaterializationQualityScoreToManifest,
  recordMaterializationQualityScore,
} from '../materialization-quality-score/index.js';
import {
  applyFeatureContractRealityToManifest,
  hasSufficientWorkspaceFeatureEvidence,
  recordFeatureContractReality,
} from '../feature-contract-reality/index.js';
import {
  applyWorkspaceRealityAuditToManifest,
  recordWorkspaceRealityAudit,
} from '../workspace-reality-audit/index.js';
import type { MaterializationProfile } from '../universal-prompt-to-app-materialization/profile-feature-map.js';

const PREVIEW_MAX = 2000;

function inferProjectRootDir(workspaceDir: string): string {
  const normalized = workspaceDir.replace(/\\/g, '/');
  const marker = '/.generated-builder-workspaces/';
  const idx = normalized.indexOf(marker);
  if (idx >= 0) return normalized.slice(0, idx);
  return join(workspaceDir, '..', '..');
}

function pathsByCategory(
  files: Array<{ path: string; category: GeneratedFileCategory }>,
  category: GeneratedFileCategory,
): string[] {
  return files.filter((file) => file.category === category).map((file) => file.path);
}

function previewText(value: string | null | undefined, max = PREVIEW_MAX): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max)}…`;
}

export function extractExecCommandFailure(
  err: unknown,
  failedCommand: string,
): ForensicCommandFailure {
  const record = err && typeof err === 'object' ? (err as Record<string, unknown>) : {};
  const stdout =
    typeof record.stdout === 'string'
      ? record.stdout
      : Buffer.isBuffer(record.stdout)
        ? record.stdout.toString('utf8')
        : null;
  const stderr =
    typeof record.stderr === 'string'
      ? record.stderr
      : Buffer.isBuffer(record.stderr)
        ? record.stderr.toString('utf8')
        : null;
  const exitCode =
    typeof record.status === 'number'
      ? record.status
      : typeof record.code === 'number'
        ? record.code
        : null;
  const message = err instanceof Error ? err.message : String(err);
  const stackPreview = err instanceof Error ? previewText(err.stack ?? null, 800) : null;

  return {
    failedCommand,
    exitCode,
    stderrPreview: previewText(stderr),
    stdoutPreview: previewText(stdout),
    failureMessage: message,
    errorCode: exitCode !== null ? `EXIT_${exitCode}` : 'EXEC_FAILED',
    stackPreview,
  };
}

function manifestPathFor(workspaceDir: string): string {
  return join(workspaceDir, GENERATED_APP_MANIFEST_FILENAME);
}

function readManifest(workspaceDir: string): GeneratedAppManifest | null {
  const path = manifestPathFor(workspaceDir);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as GeneratedAppManifest;
  } catch {
    return null;
  }
}

function writeManifest(workspaceDir: string, manifest: GeneratedAppManifest): GeneratedAppManifest {
  mkdirSync(workspaceDir, { recursive: true });
  writeFileSync(manifestPathFor(workspaceDir), serializeGeneratedAppManifest(manifest), 'utf8');
  return manifest;
}

function applyDiscovery(manifest: GeneratedAppManifest, workspaceDir: string): GeneratedAppManifest {
  if (!existsSync(workspaceDir)) return manifest;
  const discovery = discoverWorkspaceFiles(workspaceDir);
  const featureModuleFiles = discovery.files
    .filter((file) => file.path.startsWith('src/features/'))
    .filter((file) => !file.path.endsWith('registry.ts') && !file.path.endsWith('routes.ts'))
    .filter((file) => !file.path.endsWith('FeatureAppRouter.tsx'))
    .map((file) => file.path);
  const featureModuleDirectories = discovery.directories.filter(
    (dir) =>
      dir.startsWith('src/features/') &&
      dir !== 'src/features' &&
      dir !== 'src/features/domain',
  );
  const featureComponentCount = discovery.files.filter(
    (file) =>
      file.category === 'Feature' &&
      file.path.startsWith('src/features/') &&
      file.path.endsWith('Feature.tsx'),
  ).length;
  return {
    ...manifest,
    generatedFilesCount: discovery.generatedFilesCount,
    generatedDirectoriesCount: discovery.generatedDirectoriesCount,
    generatedComponentsCount: discovery.generatedComponentsCount,
    generatedPagesCount: discovery.generatedPagesCount,
    generatedRoutesCount: Math.max(manifest.routes.length, discovery.generatedRoutesCount),
    generatedFeatureModulesCount: Math.max(
      manifest.featureModuleDetails.length,
      featureComponentCount,
      manifest.generatedFeatureModulesCount,
    ),
    generatedFeatureModuleFiles: featureModuleFiles,
    featureModuleDirectories,
    generatedServicesCount: discovery.generatedServicesCount,
    generatedModelsCount: discovery.generatedModelsCount,
    generatedAssetsCount: discovery.generatedAssetsCount,
    generatedStylesCount: discovery.generatedStylesCount,
    generatedTestsCount: discovery.generatedTestsCount,
    totalLinesGenerated: discovery.totalLinesGenerated,
    workspaceSizeBytes: discovery.workspaceSizeBytes,
    generatedFiles: discovery.files,
    generatedDirectories: discovery.directories,
    services: pathsByCategory(discovery.files, 'Service'),
    models: pathsByCategory(discovery.files, 'Model'),
    assets: pathsByCategory(discovery.files, 'Asset'),
    styles: pathsByCategory(discovery.files, 'Style'),
    lastGeneratedFileCount: discovery.generatedFilesCount,
    lastGeneratedDirectoryCount: discovery.generatedDirectoriesCount,
  };
}

function attachPartialAndFullHashes(
  manifest: GeneratedAppManifest,
  workspaceDir: string,
): GeneratedAppManifest {
  const discovery = existsSync(workspaceDir) ? discoverWorkspaceFiles(workspaceDir) : null;
  const files = discovery?.files ?? manifest.generatedFiles;
  const withHashes = attachManifestHashes(manifest, files);
  return {
    ...withHashes,
    partialWorkspaceHash: withHashes.workspaceHash,
    partialMaterializationHash: withHashes.materializationHash,
  };
}

function appendStageHistory(
  manifest: GeneratedAppManifest,
  record: ForensicManifestStageRecord,
): GeneratedAppManifest {
  return {
    ...manifest,
    stageHistory: [...manifest.stageHistory, record],
  };
}

export function initializeForensicManifest(
  input: ForensicManifestInitializeInput,
): GeneratedAppManifest {
  mkdirSync(input.workspaceDir, { recursive: true });
  const manifest = buildInitialGeneratedAppManifest({
    projectId: input.projectId,
    projectName: input.projectName,
    buildRunId: input.buildRunId,
    prompt: input.prompt,
    selectedProfile: input.selectedProfile,
    expectedAppType: input.expectedAppType,
    promptSummary: input.promptSummary,
    confidence: input.confidence,
    featureModules: input.featureModules,
    routes: input.routes,
    workspacePath: input.workspacePath,
    fallbackUsed: input.fallbackUsed,
  });

  const initialized = appendStageHistory(
    {
      ...manifest,
      currentStage: 'STARTED',
      status: 'IN_PROGRESS',
    },
    {
      stage: 'STARTED',
      status: 'IN_PROGRESS',
      timestamp: new Date().toISOString(),
      durationMs: 0,
      warnings: [],
      errors: [],
      generatedFilesCount: 0,
      generatedDirectoriesCount: 0,
    },
  );

  return writeManifest(input.workspaceDir, initialized);
}

export function updateForensicManifestStage(
  workspaceDir: string,
  update: ForensicManifestStageUpdate,
): GeneratedAppManifest {
  const writeStarted = performance.now();
  let manifest =
    readManifest(workspaceDir) ??
    buildInitialGeneratedAppManifest({
      projectId: 'unknown',
      projectName: 'unknown',
      buildRunId: 'unknown',
      prompt: '',
      selectedProfile: 'GENERIC_CUSTOM_APP_V1',
      expectedAppType: 'unknown',
      promptSummary: '',
      confidence: 'UNKNOWN',
      featureModules: [],
      routes: [],
    });

  if (update.selectedProfile) manifest = { ...manifest, selectedProfile: update.selectedProfile };
  if (update.confidence) manifest = { ...manifest, confidence: update.confidence };
  if (update.timingsPatch) {
    manifest = { ...manifest, ...update.timingsPatch };
  }

  manifest = applyDiscovery(manifest, workspaceDir);

  const stageStatus: ForensicManifestStatus = update.status ?? 'IN_PROGRESS';
  const stageRecord: ForensicManifestStageRecord = {
    stage: update.stage,
    status: stageStatus,
    timestamp: new Date().toISOString(),
    durationMs: update.durationMs ?? 0,
    warnings: update.warnings ?? [],
    errors: update.errors ?? [],
    generatedFilesCount: manifest.generatedFilesCount,
    generatedDirectoriesCount: manifest.generatedDirectoriesCount,
  };

  const lastSuccessfulStage =
    stageStatus === 'IN_PROGRESS' || stageStatus === 'PASS' ? update.stage : manifest.lastSuccessfulStage;

  manifest = appendStageHistory(
    {
      ...manifest,
      currentStage: update.stage,
      status: stageStatus === 'PASS' ? manifest.status : stageStatus,
      lastSuccessfulStage: lastSuccessfulStage ?? manifest.lastSuccessfulStage,
      warnings: [...manifest.warnings, ...(update.warnings ?? [])],
      errors: [...manifest.errors, ...(update.errors ?? [])],
      manifestWriteDurationMs: Math.round(performance.now() - writeStarted),
    },
    stageRecord,
  );

  return writeManifest(workspaceDir, manifest);
}

export function recordForensicManifestAseContinuationOverride(
  workspaceDir: string,
  input: {
    aseBlockers: readonly string[];
    warning: string;
  },
): GeneratedAppManifest {
  return updateForensicManifestStage(workspaceDir, {
    stage: 'ASE_AUTHORIZATION',
    status: 'IN_PROGRESS',
    warnings: [
      input.warning,
      ...input.aseBlockers.map((blocker) => `ASE blocker overridden: ${blocker}`),
    ],
  });
}

export function recordForensicManifestAeeExecutiveDecision(
  workspaceDir: string,
  input: {
    decision: string;
    reasoning: string;
    overrideEvent: string | null;
    overriddenBlockers: readonly string[];
    respectedBlockers: readonly string[];
    evidenceProviders: readonly string[];
  },
): GeneratedAppManifest {
  const warnings = [
    input.reasoning,
    ...(input.overrideEvent ? [`AEE event: ${input.overrideEvent}`] : []),
    ...input.overriddenBlockers.map((blocker) => `AEE overridden blocker: ${blocker}`),
    ...input.respectedBlockers.map((blocker) => `AEE respected blocker: ${blocker}`),
    ...input.evidenceProviders.map((provider) => `AEE evidence provider: ${provider}`),
  ];
  return updateForensicManifestStage(workspaceDir, {
    stage: 'AEE_EXECUTIVE_COORDINATION',
    status: 'IN_PROGRESS',
    warnings,
  });
}

export function finalizeForensicManifestFailure(
  workspaceDir: string,
  input: ForensicManifestFailureInput,
): GeneratedAppManifest {
  const writeStarted = performance.now();
  let manifest =
    readManifest(workspaceDir) ??
    buildInitialGeneratedAppManifest({
      projectId: 'unknown',
      projectName: 'unknown',
      buildRunId: 'unknown',
      prompt: '',
      selectedProfile: 'GENERIC_CUSTOM_APP_V1',
      expectedAppType: 'unknown',
      promptSummary: '',
      confidence: 'UNKNOWN',
      featureModules: [],
      routes: [],
    });

  manifest = applyDiscovery(manifest, workspaceDir);

  const finalStatus = input.status ?? 'FAIL';
  const failureMessage = input.failureMessage ?? input.failureReason;
  const command = input.commandFailure;

  manifest = {
    ...manifest,
    status: finalStatus,
    currentStage: input.failureStage,
    validationStatus: finalStatus === 'PARTIAL' ? 'PARTIAL' : 'FAIL',
    failureStage: input.failureStage,
    failureReason: input.failureReason,
    failureMessage,
    errorCode: input.errorCode ?? command?.errorCode ?? null,
    stackPreview: input.stackPreview ?? command?.stackPreview ?? null,
    lastSuccessfulStage: input.lastSuccessfulStage ?? manifest.lastSuccessfulStage,
    lastGeneratedFileCount: manifest.generatedFilesCount,
    lastGeneratedDirectoryCount: manifest.generatedDirectoriesCount,
    failedCommand: command?.failedCommand ?? null,
    exitCode: command?.exitCode ?? null,
    stderrPreview: command?.stderrPreview ?? null,
    stdoutPreview: command?.stdoutPreview ?? null,
    warnings: [...manifest.warnings, ...(input.warnings ?? [])],
    errors: [...manifest.errors, ...(input.errors ?? []), input.failureReason],
    completedAt: new Date().toISOString(),
    manifestWriteDurationMs: Math.round(performance.now() - writeStarted),
  };

  manifest = appendStageHistory(manifest, {
    stage: input.failureStage,
    status: finalStatus,
    timestamp: new Date().toISOString(),
    durationMs: 0,
    warnings: input.warnings ?? [],
    errors: [input.failureReason, ...(input.errors ?? [])],
    generatedFilesCount: manifest.generatedFilesCount,
    generatedDirectoriesCount: manifest.generatedDirectoriesCount,
  });

  manifest = attachPartialAndFullHashes(manifest, workspaceDir);

  let finalManifest = manifest;
  const projectRootDir = inferProjectRootDir(workspaceDir);
  try {
    const historyRecording = recordBuildHistory({
      projectRootDir,
      workspaceDir,
      manifest,
    });
    finalManifest = applyBuildHistoryToManifest(manifest, historyRecording.evidence);
  } catch (error) {
    finalManifest = {
      ...manifest,
      buildHistoryRecorded: false,
      buildHistoryIntegrityStatus: 'FAIL',
      buildHistoryFailureReasons: [
        error instanceof Error ? error.message : String(error),
      ],
    };
  }

  try {
    const failureEvidence = buildFailurePersistentProjectEvidence({
      projectRootDir,
      workspaceDir,
      manifest: finalManifest,
      projectId: finalManifest.projectId,
      projectName: finalManifest.projectName,
    });
    finalManifest = applyPersistentProjectRealityToManifest(finalManifest, failureEvidence);
  } catch (error) {
    finalManifest = {
      ...finalManifest,
      persistentProjectRealityStatus: 'FAIL',
      promotionStatus: 'FAIL',
      promotionFailureReasons: [
        error instanceof Error ? error.message : String(error),
      ],
    };
  }

  try {
    const scoreRecording = recordMaterializationQualityScore({
      projectRootDir,
      workspaceDir,
      manifest: finalManifest,
    });
    finalManifest = applyMaterializationQualityScoreToManifest(finalManifest, scoreRecording.evidence);
  } catch (error) {
    finalManifest = {
      ...finalManifest,
      materializationQualityVerdict: 'NOT_MATERIALIZED',
      materializationQualityCriticalFailures: [
        error instanceof Error ? error.message : String(error),
      ],
    };
  }

  try {
    const featureRealityRecording = recordFeatureContractReality({
      projectRootDir,
      workspaceDir,
      manifest: finalManifest,
    });
    finalManifest = applyFeatureContractRealityToManifest(finalManifest, featureRealityRecording.evidence);
  } catch (error) {
    finalManifest = {
      ...finalManifest,
      featureContractRealityStatus: 'FAIL',
      featureRealityFailureReasons: [
        error instanceof Error ? error.message : String(error),
      ],
    };
  }

  return writeManifest(workspaceDir, finalManifest);
}

export function finalizeForensicManifestSuccess(
  input: MaterializationEvidenceCompletionInput,
): GeneratedAppManifest {
  const writeStarted = performance.now();
  const discovery = discoverWorkspaceFiles(input.workspaceDir);
  let existing = readManifest(input.workspaceDir);

  const featureComponentCount = discovery.files.filter(
    (file) =>
      file.category === 'Feature' &&
      file.path.startsWith('src/features/') &&
      file.path.endsWith('Feature.tsx'),
  ).length;
  // Product Faithfulness Glossary Precision V1 — featureModuleCount must reflect only what THIS
  // build actually produced (input.featureModules / discovered components), never a previous
  // build's on-disk featureModuleDetails.length, so a build that generates fewer/different modules
  // than a prior build at the same workspace path is never inflated by stale counts.
  const featureModuleCount = Math.max(input.featureModules.length, featureComponentCount);
  const featureModuleFiles = discovery.files
    .filter((file) => file.path.startsWith('src/features/'))
    .filter((file) => !file.path.endsWith('registry.ts') && !file.path.endsWith('routes.ts'))
    .filter((file) => !file.path.endsWith('FeatureAppRouter.tsx'))
    .map((file) => file.path);
  const featureModuleDirectories = discovery.directories.filter(
    (dir) =>
      dir.startsWith('src/features/') &&
      dir !== 'src/features' &&
      dir !== 'src/features/domain',
  );

  const partitionedModules = partitionProductAndInfrastructureModules(input.featureModules);

  const baseManifest: GeneratedAppManifest = {
    ...(existing ??
      buildInitialGeneratedAppManifest({
        projectId: input.projectId,
        projectName: input.projectName,
        buildRunId: input.buildRunId,
        prompt: input.prompt,
        selectedProfile: input.selectedProfile,
        expectedAppType: input.expectedAppType,
        promptSummary: input.promptSummary,
        confidence: input.confidence,
        featureModules: partitionedModules.productFeatureModules,
        infrastructureModules: partitionedModules.infrastructureModules,
        routes: input.routes,
        fallbackUsed: input.fallbackUsed,
      })),
    readOnly: true,
    projectId: input.projectId,
    projectName: input.projectName,
    buildRunId: input.buildRunId,
    prompt: input.prompt,
    promptSummary: input.promptSummary,
    selectedProfile: input.selectedProfile,
    expectedAppType: input.expectedAppType,
    confidence: input.confidence,
    status: 'PASS',
    currentStage: 'COMPLETE',
    generatedFilesCount: discovery.generatedFilesCount,
    generatedDirectoriesCount: discovery.generatedDirectoriesCount,
    generatedComponentsCount: discovery.generatedComponentsCount,
    generatedPagesCount: discovery.generatedPagesCount,
    generatedRoutesCount: Math.max(input.routes.length, discovery.generatedRoutesCount),
    generatedFeatureModulesCount: featureModuleCount,
    generatedFeatureModuleFiles: featureModuleFiles,
    featureModuleDirectories,
    // Product Faithfulness Glossary Precision V1 — featureModuleDetails must always originate
    // from the CURRENT generation. MaterializationEvidenceCompletionInput carries no per-module
    // detail records of its own, so there is no current-build source to rebuild from here; the
    // field previously fell back to whatever a prior manifest already on disk for this workspace
    // path happened to contain (a different build's data). That fallback is removed — an empty
    // array is the only evidence-honest value when this input has no current-build detail to give.
    featureModuleDetails: [],
    generatedServicesCount: discovery.generatedServicesCount,
    generatedModelsCount: discovery.generatedModelsCount,
    generatedAssetsCount: discovery.generatedAssetsCount,
    generatedStylesCount: discovery.generatedStylesCount,
    generatedTestsCount: discovery.generatedTestsCount,
    totalLinesGenerated: discovery.totalLinesGenerated,
    workspaceSizeBytes: discovery.workspaceSizeBytes,
    generationDurationMs: input.timings.generationDurationMs,
    materializationDurationMs: input.timings.materializationDurationMs,
    npmInstallDurationMs: input.timings.npmInstallDurationMs,
    npmBuildDurationMs: input.timings.npmBuildDurationMs,
    previewDurationMs: input.timings.previewDurationMs,
    validationDurationMs: input.timings.validationDurationMs,
    manifestWriteDurationMs: Math.round(performance.now() - writeStarted),
    planningDurationMs: input.timings.planningDurationMs,
    fileGenerationDurationMs: input.timings.fileGenerationDurationMs,
    blueprintShellPresent: input.validation.blueprintShellPresent,
    featureModulesPresent: input.validation.featureModulesPresent,
    promptSpecificTermsPresent: input.validation.promptSpecificTermsPresent,
    generatedFiles: discovery.files,
    generatedDirectories: discovery.directories,
    featureModules: partitionedModules.productFeatureModules,
    ...(partitionedModules.infrastructureModules.length > 0
      ? { infrastructureModules: partitionedModules.infrastructureModules }
      : existing?.infrastructureModules
        ? { infrastructureModules: existing.infrastructureModules }
        : {}),
    routes: input.routes,
    services: pathsByCategory(discovery.files, 'Service'),
    models: pathsByCategory(discovery.files, 'Model'),
    assets: pathsByCategory(discovery.files, 'Asset'),
    styles: pathsByCategory(discovery.files, 'Style'),
    previewEntry: existing?.previewEntry ?? '/src/main.tsx',
    validationStatus: input.validation.passed ? 'PASS' : 'PARTIAL',
    warnings: [...(existing?.warnings ?? []), ...input.validation.warnings],
    errors: input.validation.passed ? [] : [...input.validation.errors],
    fallbackUsed: input.fallbackUsed,
    lastSuccessfulStage: 'COMPLETE',
    lastGeneratedFileCount: discovery.generatedFilesCount,
    lastGeneratedDirectoryCount: discovery.generatedDirectoriesCount,
    failureStage: null,
    failureReason: null,
    failureMessage: null,
    errorCode: null,
    stackPreview: null,
    failedCommand: null,
    exitCode: null,
    stderrPreview: null,
    stdoutPreview: null,
    completedAt: new Date().toISOString(),
    stageHistory: existing?.stageHistory ?? [],
    ...(input.promptFaithfulness ?? {}),
    ...(input.previewEvidence?.previewUrl
      ? {
          previewUrl: input.previewEvidence.previewUrl,
          previewVerified: input.previewEvidence.previewVerified === true,
          previewHtmlStatus: input.previewEvidence.previewHtmlStatus ?? 'PENDING',
          visiblePreviewValidationStatus:
            input.previewEvidence.visiblePreviewValidationStatus ?? 'PENDING',
          visiblePreviewValidationFailureReasons:
            input.previewEvidence.visiblePreviewValidationFailureReasons ?? [],
        }
      : {}),
  };

  const withHashes = attachPartialAndFullHashes(baseManifest, input.workspaceDir);
  const finalized = appendStageHistory(withHashes, {
    stage: 'COMPLETE',
    status: 'PASS',
    timestamp: new Date().toISOString(),
    durationMs: 0,
    warnings: input.validation.warnings,
    errors: input.validation.passed ? [] : input.validation.errors,
    generatedFilesCount: discovery.generatedFilesCount,
    generatedDirectoriesCount: discovery.generatedDirectoriesCount,
  });

  const { shellResults, allowedDomainSources } = scanGeneratedWorkspaceShell(input.workspaceDir);
  const domainBoundary = verifyGeneratedAppDomainBoundary({
    workspaceDir: input.workspaceDir,
    profile: input.selectedProfile as MaterializationProfile,
    prompt: input.prompt,
  });
  const purityEvidence = buildBlueprintPurityEvidence({
    projectRootDir: inferProjectRootDir(input.workspaceDir),
    workspaceDir: input.workspaceDir,
    workspaceShellResults: shellResults,
    allowedDomainSources,
    domainBoundaryPassed: domainBoundary.passed,
    domainBoundaryDetail: domainBoundary.detail,
  });
  const withPurity = applyBlueprintPurityToManifest(finalized, purityEvidence);

  let withHistory = withPurity;
  const projectRootDir = inferProjectRootDir(input.workspaceDir);
  try {
    const historyRecording = recordBuildHistory({
      projectRootDir,
      workspaceDir: input.workspaceDir,
      manifest: withPurity,
    });
    withHistory = applyBuildHistoryToManifest(withPurity, historyRecording.evidence);
  } catch (error) {
    withHistory = {
      ...withPurity,
      buildHistoryRecorded: false,
      buildHistoryIntegrityStatus: 'FAIL',
      buildHistoryFailureReasons: [
        error instanceof Error ? error.message : String(error),
      ],
    };
  }

  let withReality = withHistory;
  try {
    const promotion = recordPersistentProjectReality({
      projectRootDir,
      workspaceDir: input.workspaceDir,
      manifest: withHistory,
      projectId: input.projectId,
      projectName: input.projectName,
      promoteSource:
        (input.buildSpinePassed === true ||
          (input.validation.passed &&
            (withHistory.status === 'PASS' ||
              hasSufficientWorkspaceFeatureEvidence(input.workspaceDir, input.featureModules)))) &&
        (withHistory.status === 'PASS' ||
          input.buildSpinePassed === true ||
          hasSufficientWorkspaceFeatureEvidence(input.workspaceDir, input.featureModules)),
    });
    withReality = applyPersistentProjectRealityToManifest(withHistory, promotion.evidence);
  } catch (error) {
    withReality = {
      ...withHistory,
      persistentProjectRealityStatus: 'FAIL',
      promotionStatus: 'FAIL',
      promotionFailureReasons: [
        error instanceof Error ? error.message : String(error),
      ],
    };
  }

  let withFeatureReality = withReality;
  try {
    const featureRealityRecording = recordFeatureContractReality({
      projectRootDir,
      workspaceDir: input.workspaceDir,
      manifest: withReality,
    });
    withFeatureReality = applyFeatureContractRealityToManifest(withReality, featureRealityRecording.evidence);
  } catch (error) {
    withFeatureReality = {
      ...withReality,
      featureContractRealityStatus: 'FAIL',
      featureRealityFailureReasons: [
        error instanceof Error ? error.message : String(error),
      ],
    };
  }

  let withWorkspaceAudit = withFeatureReality;
  try {
    const workspaceAuditRecording = recordWorkspaceRealityAudit({
      projectRootDir,
      workspaceDir: input.workspaceDir,
      manifest: withFeatureReality,
    });
    withWorkspaceAudit = applyWorkspaceRealityAuditToManifest(
      withFeatureReality,
      workspaceAuditRecording.evidence,
    );
  } catch (error) {
    withWorkspaceAudit = {
      ...withFeatureReality,
      workspaceRealityAuditStatus: 'FAIL',
      workspaceRealityFailureReasons: [
        error instanceof Error ? error.message : String(error),
      ],
    };
  }

  let withScore = withWorkspaceAudit;
  try {
    const scoreRecording = recordMaterializationQualityScore({
      projectRootDir,
      workspaceDir: input.workspaceDir,
      manifest: withWorkspaceAudit,
    });
    withScore = applyMaterializationQualityScoreToManifest(withWorkspaceAudit, scoreRecording.evidence);
  } catch (error) {
    withScore = {
      ...withWorkspaceAudit,
      materializationQualityVerdict: 'NOT_MATERIALIZED',
      materializationQualityCriticalFailures: [
        error instanceof Error ? error.message : String(error),
      ],
    };
  }

  writeFileSync(
    manifestPathFor(input.workspaceDir),
    serializeGeneratedAppManifest(withScore),
    'utf8',
  );
  if (withScore.workspaceHash) {
    stampPreviewWorkspaceIdentity({
      workspaceDir: input.workspaceDir,
      workspaceHash: withScore.workspaceHash,
      projectId: input.projectId,
    });
  }
  return withScore;
}

export function readForensicManifest(workspaceDir: string): GeneratedAppManifest | null {
  return readManifest(workspaceDir);
}
