/**
 * Universal Prompt-to-App Materialization — generated workspace manifest.
 * Materialization Evidence + Failed Build Forensic Manifest lifecycle fields.
 */

import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import type { MaterializationProfile } from './profile-feature-map.js';
import type { GeneratedFileInventoryEntry } from '../materialization-evidence/materialization-evidence-types.js';
import type {
  ForensicBuildStage,
  ForensicManifestStageRecord,
  ForensicManifestStatus,
} from '../materialization-evidence/forensic-manifest-types.js';

export const GENERATED_APP_MANIFEST_FILENAME = '.generated-app-manifest.json';

export interface GeneratedAppManifest {
  readOnly: true;
  projectId: string;
  projectName: string;
  buildRunId: string;
  prompt: string;
  promptSummary: string;
  selectedProfile: GeneratedAppProfile | MaterializationProfile | string;
  expectedAppType: string;
  confidence: string;
  workspacePath: string | null;
  status: ForensicManifestStatus;
  currentStage: ForensicBuildStage;
  generatedFilesCount: number;
  generatedDirectoriesCount: number;
  generatedComponentsCount: number;
  generatedPagesCount: number;
  generatedRoutesCount: number;
  generatedFeatureModulesCount: number;
  generatedServicesCount: number;
  generatedModelsCount: number;
  generatedAssetsCount: number;
  generatedStylesCount: number;
  generatedTestsCount: number;
  totalLinesGenerated: number;
  workspaceSizeBytes: number;
  generationDurationMs: number;
  materializationDurationMs: number;
  npmInstallDurationMs: number;
  npmBuildDurationMs: number;
  previewDurationMs: number;
  validationDurationMs: number;
  manifestWriteDurationMs: number;
  planningDurationMs: number;
  fileGenerationDurationMs: number;
  blueprintShellPresent: boolean;
  featureModulesPresent: boolean;
  promptSpecificTermsPresent: boolean;
  generatedFiles: GeneratedFileInventoryEntry[];
  generatedDirectories: string[];
  featureModules: string[];
  routes: string[];
  services: string[];
  models: string[];
  assets: string[];
  styles: string[];
  previewEntry: string;
  validationStatus: 'PASS' | 'FAIL' | 'PENDING' | 'PARTIAL';
  warnings: string[];
  errors: string[];
  fallbackUsed: boolean;
  workspaceHash: string;
  manifestHash: string;
  materializationHash: string;
  partialWorkspaceHash: string;
  partialMaterializationHash: string;
  lastSuccessfulStage: ForensicBuildStage | null;
  lastGeneratedFileCount: number;
  lastGeneratedDirectoryCount: number;
  failureStage: ForensicBuildStage | null;
  failureReason: string | null;
  failureMessage: string | null;
  errorCode: string | null;
  stackPreview: string | null;
  failedCommand: string | null;
  exitCode: number | null;
  stderrPreview: string | null;
  stdoutPreview: string | null;
  stageHistory: ForensicManifestStageRecord[];
  createdAt: string;
  completedAt: string | null;
}

export function buildInitialGeneratedAppManifest(input: {
  projectId: string;
  projectName: string;
  buildRunId: string;
  prompt: string;
  selectedProfile: GeneratedAppProfile | MaterializationProfile | string;
  expectedAppType: string;
  promptSummary: string;
  confidence: string;
  featureModules: string[];
  routes: string[];
  workspacePath?: string | null;
  fallbackUsed?: boolean;
}): GeneratedAppManifest {
  const now = new Date().toISOString();
  return {
    readOnly: true,
    projectId: input.projectId,
    projectName: input.projectName,
    buildRunId: input.buildRunId,
    prompt: input.prompt,
    promptSummary: input.promptSummary,
    selectedProfile: input.selectedProfile,
    expectedAppType: input.expectedAppType,
    confidence: input.confidence,
    workspacePath: input.workspacePath ?? null,
    status: 'IN_PROGRESS',
    currentStage: 'STARTED',
    generatedFilesCount: 0,
    generatedDirectoriesCount: 0,
    generatedComponentsCount: 0,
    generatedPagesCount: 0,
    generatedRoutesCount: 0,
    generatedFeatureModulesCount: 0,
    generatedServicesCount: 0,
    generatedModelsCount: 0,
    generatedAssetsCount: 0,
    generatedStylesCount: 0,
    generatedTestsCount: 0,
    totalLinesGenerated: 0,
    workspaceSizeBytes: 0,
    generationDurationMs: 0,
    materializationDurationMs: 0,
    npmInstallDurationMs: 0,
    npmBuildDurationMs: 0,
    previewDurationMs: 0,
    validationDurationMs: 0,
    manifestWriteDurationMs: 0,
    planningDurationMs: 0,
    fileGenerationDurationMs: 0,
    blueprintShellPresent: false,
    featureModulesPresent: false,
    promptSpecificTermsPresent: false,
    generatedFiles: [],
    generatedDirectories: [],
    featureModules: input.featureModules,
    routes: input.routes,
    services: [],
    models: [],
    assets: [],
    styles: [],
    previewEntry: '/src/main.tsx',
    validationStatus: 'PENDING',
    warnings: [],
    errors: [],
    fallbackUsed: input.fallbackUsed ?? false,
    workspaceHash: '',
    manifestHash: '',
    materializationHash: '',
    partialWorkspaceHash: '',
    partialMaterializationHash: '',
    lastSuccessfulStage: null,
    lastGeneratedFileCount: 0,
    lastGeneratedDirectoryCount: 0,
    failureStage: null,
    failureReason: null,
    failureMessage: null,
    errorCode: null,
    stackPreview: null,
    failedCommand: null,
    exitCode: null,
    stderrPreview: null,
    stdoutPreview: null,
    stageHistory: [],
    createdAt: now,
    completedAt: null,
  };
}

/** @deprecated Use buildInitialGeneratedAppManifest */
export function buildGeneratedAppManifest(input: {
  projectId: string;
  projectName: string;
  buildRunId: string;
  selectedProfile: GeneratedAppProfile | MaterializationProfile;
  expectedAppType: string;
  promptSummary: string;
  featureModules: string[];
  routes: string[];
  generatedFiles: string[];
  validation?: Partial<GeneratedAppManifest>;
}): GeneratedAppManifest {
  return buildInitialGeneratedAppManifest({
    projectId: input.projectId,
    projectName: input.projectName,
    buildRunId: input.buildRunId,
    prompt: input.promptSummary,
    selectedProfile: input.selectedProfile,
    expectedAppType: input.expectedAppType,
    promptSummary: input.promptSummary,
    confidence: 'UNKNOWN',
    featureModules: input.featureModules,
    routes: input.routes,
    fallbackUsed: input.validation?.fallbackUsed ?? false,
  });
}

export function serializeGeneratedAppManifest(manifest: GeneratedAppManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export function isManifestEvidenceComplete(manifest: GeneratedAppManifest): boolean {
  if (!manifest.completedAt) return false;
  if (manifest.status === 'IN_PROGRESS') return false;
  if (manifest.status === 'PASS') {
    if (manifest.generatedFilesCount <= 0) return false;
    if (manifest.generatedFiles.length <= 0) return false;
    if (!manifest.workspaceHash || !manifest.materializationHash) return false;
    return manifest.validationStatus === 'PASS';
  }
  if (manifest.status === 'FAIL' || manifest.status === 'PARTIAL' || manifest.status === 'ABORTED') {
    return Boolean(manifest.failureStage && manifest.failureReason);
  }
  return false;
}

export function isForensicManifestPresent(manifest: GeneratedAppManifest | null): boolean {
  return manifest !== null && manifest.buildRunId.length > 0 && manifest.createdAt.length > 0;
}

export function listManifestPlaceholderFields(manifest: GeneratedAppManifest): string[] {
  const missing: string[] = [];
  if (manifest.status === 'IN_PROGRESS') missing.push('status');
  if (!manifest.completedAt) missing.push('completedAt');
  if (manifest.status === 'PASS') {
    if (manifest.generatedFilesCount <= 0) missing.push('generatedFilesCount');
    if (manifest.generatedFiles.length === 0) missing.push('generatedFiles');
    if (!manifest.workspaceHash) missing.push('workspaceHash');
    if (!manifest.materializationHash) missing.push('materializationHash');
  }
  if (manifest.status === 'FAIL' || manifest.status === 'PARTIAL' || manifest.status === 'ABORTED') {
    if (!manifest.failureStage) missing.push('failureStage');
    if (!manifest.failureReason) missing.push('failureReason');
  }
  if (manifest.validationStatus === 'PENDING' && manifest.status === 'PASS') {
    missing.push('validationStatus');
  }
  return missing;
}
