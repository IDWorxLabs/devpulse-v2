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
import { discoverWorkspaceFiles } from './workspace-file-discovery-engine.js';
import { attachManifestHashes } from './materialization-hash-engine.js';
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

const PREVIEW_MAX = 2000;

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
  return {
    ...manifest,
    generatedFilesCount: discovery.generatedFilesCount,
    generatedDirectoriesCount: discovery.generatedDirectoriesCount,
    generatedComponentsCount: discovery.generatedComponentsCount,
    generatedPagesCount: discovery.generatedPagesCount,
    generatedRoutesCount: Math.max(manifest.routes.length, discovery.generatedRoutesCount),
    generatedFeatureModulesCount: Math.max(
      manifest.featureModules.length,
      discovery.generatedFeatureModulesCount,
    ),
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
  return writeManifest(workspaceDir, manifest);
}

export function finalizeForensicManifestSuccess(
  input: MaterializationEvidenceCompletionInput,
): GeneratedAppManifest {
  const writeStarted = performance.now();
  const discovery = discoverWorkspaceFiles(input.workspaceDir);
  let existing = readManifest(input.workspaceDir);

  const routeCount = Math.max(input.routes.length, discovery.generatedRoutesCount);
  const featureModuleCount = Math.max(
    input.featureModules.length,
    discovery.generatedFeatureModulesCount,
  );

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
        featureModules: input.featureModules,
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
    generatedRoutesCount: routeCount,
    generatedFeatureModulesCount: featureModuleCount,
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
    featureModules: input.featureModules,
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

  writeFileSync(
    manifestPathFor(input.workspaceDir),
    serializeGeneratedAppManifest(finalized),
    'utf8',
  );
  return finalized;
}

export function readForensicManifest(workspaceDir: string): GeneratedAppManifest | null {
  return readManifest(workspaceDir);
}
