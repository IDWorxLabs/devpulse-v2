/**
 * Persistent Project Reality V1 — promote build workspace to permanent project source.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import { GENERATED_APP_MANIFEST_FILENAME } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import { PRODUCTION_VALIDATION_EVIDENCE_FILENAME } from '../production-validation/production-validation-types.js';
import { buildProjectFileIndex } from './persistent-project-reality-file-index.js';
import { buildExportMetadata } from './persistent-project-reality-export-metadata.js';
import { persistentProjectPaths, relativeFromProjectRoot } from './persistent-project-reality-paths.js';
import type {
  PersistentProjectPromotionResult,
  PersistentProjectRecord,
  PersistentProjectRealityEvidence,
} from './persistent-project-reality-types.js';

const COPY_SKIP = new Set(['node_modules', 'dist', '.git']);

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readExistingProjectRecord(path: string): PersistentProjectRecord | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8')) as PersistentProjectRecord;
}

export function syncBuildWorkspaceToPersistentSource(input: {
  buildWorkspaceDir: string;
  sourceDir: string;
}): void {
  if (existsSync(input.sourceDir)) {
    rmSync(input.sourceDir, { recursive: true, force: true });
  }
  mkdirSync(input.sourceDir, { recursive: true });

  for (const entry of readdirSync(input.buildWorkspaceDir)) {
    if (COPY_SKIP.has(entry)) continue;
    if (entry === GENERATED_APP_MANIFEST_FILENAME) continue;
    if (entry === PRODUCTION_VALIDATION_EVIDENCE_FILENAME) continue;
    cpSync(join(input.buildWorkspaceDir, entry), join(input.sourceDir, entry), { recursive: true });
  }
}

export function promotePersistentProjectReality(input: {
  projectRootDir: string;
  buildWorkspaceDir: string;
  manifest: GeneratedAppManifest;
  projectId: string;
  projectName: string;
  promoteSource: boolean;
}): PersistentProjectPromotionResult {
  if (!input.promoteSource) {
    return skipPromotion(input, 'Build validation did not pass — source promotion skipped');
  }

  const paths = persistentProjectPaths(input.projectRootDir, input.projectId);
  mkdirSync(paths.root, { recursive: true });
  mkdirSync(paths.aidev, { recursive: true });
  mkdirSync(paths.snapshotsDir, { recursive: true });
  mkdirSync(paths.versionsDir, { recursive: true });

  syncBuildWorkspaceToPersistentSource({
    buildWorkspaceDir: input.buildWorkspaceDir,
    sourceDir: paths.source,
  });

  const manifestSource = join(input.buildWorkspaceDir, GENERATED_APP_MANIFEST_FILENAME);
  if (existsSync(manifestSource)) {
    writeFileSync(paths.manifest, readFileSync(manifestSource, 'utf8'), 'utf8');
  }

  const contractSource = join(input.buildWorkspaceDir, 'universal-feature-contract.json');
  if (existsSync(contractSource)) {
    writeFileSync(paths.featureContract, readFileSync(contractSource, 'utf8'), 'utf8');
  }

  const prodSource = join(input.buildWorkspaceDir, PRODUCTION_VALIDATION_EVIDENCE_FILENAME);
  if (existsSync(prodSource)) {
    writeFileSync(paths.productionValidation, readFileSync(prodSource, 'utf8'), 'utf8');
  }

  writeJson(paths.buildHistoryLinks, {
    readOnly: true,
    buildHistoryRecorded: input.manifest.buildHistoryRecorded,
    buildHistoryRunId: input.manifest.buildHistoryRunId,
    buildHistoryRecordPath: input.manifest.buildHistoryRecordPath,
    buildHistoryRecordHash: input.manifest.buildHistoryRecordHash,
    replayMetadataPath: input.manifest.replayMetadataPath,
    auditTimelinePath: input.manifest.auditTimelinePath,
  });

  const fileIndex = buildProjectFileIndex({
    projectId: input.projectId,
    projectRoot: paths.root,
    sourceRoot: paths.source,
    aidevDir: paths.aidev,
  });
  writeJson(paths.projectFileIndex, fileIndex);

  const exportMetadata = buildExportMetadata({
    sourceRoot: paths.source,
    fileIndex,
  });
  writeJson(paths.exportMetadata, exportMetadata);

  const existing = readExistingProjectRecord(paths.projectJson);
  const now = new Date().toISOString();
  const projectRecord: PersistentProjectRecord = {
    readOnly: true,
    projectId: input.projectId,
    projectName: input.projectName,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    selectedProfile: String(input.manifest.selectedProfile),
    originalPrompt: input.manifest.prompt,
    currentSourcePath: relativeFromProjectRoot(input.projectRootDir, paths.source),
    activeWorkspacePath: relativeFromProjectRoot(input.projectRootDir, paths.root),
    lastBuildRunId: input.manifest.buildRunId,
    lastSuccessfulBuildRunId: input.manifest.buildRunId,
    manifestPath: relativeFromProjectRoot(input.projectRootDir, paths.manifest),
    featureContractPath: relativeFromProjectRoot(input.projectRootDir, paths.featureContract),
    buildHistoryRecordPath: input.manifest.buildHistoryRecordPath,
    productionValidationPath: existsSync(paths.productionValidation)
      ? relativeFromProjectRoot(input.projectRootDir, paths.productionValidation)
      : null,
    exportMetadataPath: relativeFromProjectRoot(input.projectRootDir, paths.exportMetadata),
    projectFileIndexPath: relativeFromProjectRoot(input.projectRootDir, paths.projectFileIndex),
    status: 'PROMOTED',
    immutableBuildLinks: input.manifest.buildHistoryRecordPath
      ? [input.manifest.buildHistoryRecordPath]
      : [],
  };
  writeJson(paths.projectJson, projectRecord);

  writeJson(paths.auditLog, {
    readOnly: true,
    entries: [
      {
        timestamp: now,
        event: 'source_promoted',
        buildRunId: input.manifest.buildRunId,
        sourcePath: projectRecord.currentSourcePath,
      },
    ],
  });

  const evidence: PersistentProjectRealityEvidence = {
    readOnly: true,
    persistentProjectRealityStatus: exportMetadata.exportReady ? 'PASS' : 'FAIL',
    persistentProjectId: input.projectId,
    persistentProjectWorkspacePath: relativeFromProjectRoot(input.projectRootDir, paths.root),
    persistentProjectSourceRoot: projectRecord.currentSourcePath,
    projectFileIndexPath: projectRecord.projectFileIndexPath,
    exportMetadataPath: projectRecord.exportMetadataPath,
    promotedFromBuildWorkspace: input.buildWorkspaceDir.replace(/\\/g, '/'),
    promotionStatus: exportMetadata.exportReady ? 'PASS' : 'FAIL',
    promotionFailureReasons: exportMetadata.failureReasons,
    projectRecordPath: relativeFromProjectRoot(input.projectRootDir, paths.projectJson),
    recordedAt: now,
  };

  return { readOnly: true, evidence, projectRecord, fileIndex, exportMetadata };
}

function skipPromotion(
  input: {
    projectRootDir: string;
    buildWorkspaceDir: string;
    manifest: GeneratedAppManifest;
    projectId: string;
    projectName: string;
  },
  reason: string,
): PersistentProjectPromotionResult {
  const paths = persistentProjectPaths(input.projectRootDir, input.projectId);
  const existing = readExistingProjectRecord(paths.projectJson);
  const now = new Date().toISOString();
  const evidence: PersistentProjectRealityEvidence = {
    readOnly: true,
    persistentProjectRealityStatus: 'SKIPPED',
    persistentProjectId: input.projectId,
    persistentProjectWorkspacePath: relativeFromProjectRoot(input.projectRootDir, paths.root),
    persistentProjectSourceRoot: existing?.currentSourcePath ?? '',
    projectFileIndexPath: existing?.projectFileIndexPath ?? '',
    exportMetadataPath: existing?.exportMetadataPath ?? '',
    promotedFromBuildWorkspace: input.buildWorkspaceDir.replace(/\\/g, '/'),
    promotionStatus: 'SKIPPED',
    promotionFailureReasons: [reason],
    projectRecordPath: relativeFromProjectRoot(input.projectRootDir, paths.projectJson),
    recordedAt: now,
  };
  const emptyRecord: PersistentProjectRecord = {
    readOnly: true,
    projectId: input.projectId,
    projectName: input.projectName,
    createdAt: now,
    updatedAt: now,
    selectedProfile: String(input.manifest.selectedProfile),
    originalPrompt: input.manifest.prompt,
    currentSourcePath: '',
    activeWorkspacePath: relativeFromProjectRoot(input.projectRootDir, paths.root),
    lastBuildRunId: input.manifest.buildRunId,
    lastSuccessfulBuildRunId: null,
    manifestPath: '',
    featureContractPath: '',
    buildHistoryRecordPath: input.manifest.buildHistoryRecordPath,
    productionValidationPath: null,
    exportMetadataPath: '',
    projectFileIndexPath: '',
    status: 'PENDING',
    immutableBuildLinks: [],
  };
  return {
    readOnly: true,
    evidence,
    projectRecord: existing ?? emptyRecord,
    fileIndex: {
      readOnly: true,
      projectId: input.projectId,
      sourceRoot: '',
      scannedAt: now,
      sourceFiles: [],
      configFiles: [],
      publicAssets: [],
      featureModules: [],
      routes: [],
      registryFiles: [],
      styles: [],
      metadataFiles: [],
      generatedLines: 0,
      fileHashes: {},
    },
    exportMetadata: {
      readOnly: true,
      exportReady: false,
      exportableSourceRoot: '',
      includedFiles: [],
      excludedFiles: [],
      requiredCommands: [],
      detectedFramework: 'unknown',
      packageManager: 'npm',
      buildCommand: 'npm run build',
      devCommand: 'npm run dev',
      zipSafe: false,
      deploymentReady: false,
      failureReasons: [reason],
    },
  };
}

export function recordPersistentProjectFailureEvidence(input: {
  projectRootDir: string;
  buildWorkspaceDir: string;
  manifest: GeneratedAppManifest;
  projectId: string;
  projectName: string;
}): void {
  const paths = persistentProjectPaths(input.projectRootDir, input.projectId);
  mkdirSync(paths.snapshotsDir, { recursive: true });
  const failedSnapshotDir = join(paths.snapshotsDir, `failed-${input.manifest.buildRunId}`);
  mkdirSync(failedSnapshotDir, { recursive: true });

  const manifestSource = join(input.buildWorkspaceDir, GENERATED_APP_MANIFEST_FILENAME);
  if (existsSync(manifestSource)) {
    writeFileSync(join(failedSnapshotDir, 'manifest.snapshot.json'), readFileSync(manifestSource), 'utf8');
  }

  const existing = readExistingProjectRecord(paths.projectJson);
  const now = new Date().toISOString();
  const record: PersistentProjectRecord = {
    readOnly: true,
    projectId: input.projectId,
    projectName: input.projectName,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    selectedProfile: String(input.manifest.selectedProfile),
    originalPrompt: input.manifest.prompt,
    currentSourcePath: existing?.currentSourcePath ?? '',
    activeWorkspacePath: relativeFromProjectRoot(input.projectRootDir, paths.root),
    lastBuildRunId: input.manifest.buildRunId,
    lastSuccessfulBuildRunId: existing?.lastSuccessfulBuildRunId ?? null,
    manifestPath: existing?.manifestPath ?? '',
    featureContractPath: existing?.featureContractPath ?? '',
    buildHistoryRecordPath: input.manifest.buildHistoryRecordPath,
    productionValidationPath: existing?.productionValidationPath ?? null,
    exportMetadataPath: existing?.exportMetadataPath ?? '',
    projectFileIndexPath: existing?.projectFileIndexPath ?? '',
    status: existing?.lastSuccessfulBuildRunId ? 'READY' : 'FAILED',
    immutableBuildLinks: existing?.immutableBuildLinks ?? [],
    lastFailedBuildRunId: input.manifest.buildRunId,
    lastFailedSnapshotPath: relativeFromProjectRoot(input.projectRootDir, failedSnapshotDir),
  };
  writeJson(paths.projectJson, record);
}
