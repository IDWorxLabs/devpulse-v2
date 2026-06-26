/**
 * Persistent Project Reality V1 — evidence types.
 */

export const PERSISTENT_PROJECT_REALITY_V1_PASS_TOKEN = 'PERSISTENT_PROJECT_REALITY_V1_PASS';

export const PERSISTENT_PROJECTS_DIR = '.aidev-projects';

export const PROJECT_JSON_FILENAME = 'project.json';
export const AIDEV_METADATA_DIR = '.aidev';
export const SOURCE_DIR = 'source';

export const AIDEV_MANIFEST_FILENAME = 'manifest.json';
export const AIDEV_FEATURE_CONTRACT_FILENAME = 'feature-contract.json';
export const AIDEV_PRODUCTION_VALIDATION_FILENAME = 'production-validation.json';
export const AIDEV_BUILD_HISTORY_LINKS_FILENAME = 'build-history-links.json';
export const AIDEV_PROJECT_FILE_INDEX_FILENAME = 'project-file-index.json';
export const AIDEV_EXPORT_METADATA_FILENAME = 'export-metadata.json';
export const AIDEV_MATERIALIZATION_QUALITY_SCORE_FILENAME = 'materialization-quality-score.json';
export const AIDEV_FEATURE_CONTRACT_REALITY_FILENAME = 'feature-contract-reality.json';
export const AIDEV_WORKSPACE_REALITY_AUDIT_FILENAME = 'workspace-reality-audit.json';
export const AIDEV_AUDIT_LOG_FILENAME = 'audit-log.json';

export type PersistentProjectRealityStatus = 'READY' | 'PROMOTED' | 'FAILED' | 'PENDING' | 'SKIPPED';
export type PromotionStatus = 'PASS' | 'FAIL' | 'PENDING' | 'SKIPPED';

export interface PersistentProjectRecord {
  readOnly: true;
  projectId: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  selectedProfile: string;
  originalPrompt: string;
  currentSourcePath: string;
  activeWorkspacePath: string;
  lastBuildRunId: string;
  lastSuccessfulBuildRunId: string | null;
  manifestPath: string;
  featureContractPath: string;
  buildHistoryRecordPath: string | null;
  productionValidationPath: string | null;
  exportMetadataPath: string;
  projectFileIndexPath: string;
  materializationQualityScorePath?: string | null;
  featureContractRealityPath?: string | null;
  workspaceRealityAuditPath?: string | null;
  status: PersistentProjectRealityStatus;
  immutableBuildLinks: string[];
  lastFailedBuildRunId?: string | null;
  lastFailedSnapshotPath?: string | null;
}

export interface PersistentProjectFileIndexEntry {
  readOnly: true;
  relativePath: string;
  category: 'source' | 'config' | 'public' | 'feature' | 'route' | 'registry' | 'style' | 'metadata';
  lines: number;
  size: number;
  hash: string;
}

export interface PersistentProjectFileIndex {
  readOnly: true;
  projectId: string;
  sourceRoot: string;
  scannedAt: string;
  sourceFiles: PersistentProjectFileIndexEntry[];
  configFiles: PersistentProjectFileIndexEntry[];
  publicAssets: PersistentProjectFileIndexEntry[];
  featureModules: PersistentProjectFileIndexEntry[];
  routes: PersistentProjectFileIndexEntry[];
  registryFiles: PersistentProjectFileIndexEntry[];
  styles: PersistentProjectFileIndexEntry[];
  metadataFiles: PersistentProjectFileIndexEntry[];
  generatedLines: number;
  fileHashes: Record<string, string>;
}

export interface PersistentProjectExportMetadata {
  readOnly: true;
  exportReady: boolean;
  exportableSourceRoot: string;
  includedFiles: string[];
  excludedFiles: string[];
  requiredCommands: string[];
  detectedFramework: string;
  packageManager: string;
  buildCommand: string;
  devCommand: string;
  zipSafe: boolean;
  deploymentReady: boolean;
  failureReasons: string[];
}

export interface PersistentProjectRealityEvidence {
  readOnly: true;
  persistentProjectRealityStatus: 'PASS' | 'FAIL' | 'PENDING' | 'SKIPPED';
  persistentProjectId: string;
  persistentProjectWorkspacePath: string;
  persistentProjectSourceRoot: string;
  projectFileIndexPath: string;
  exportMetadataPath: string;
  promotedFromBuildWorkspace: string;
  promotionStatus: PromotionStatus;
  promotionFailureReasons: string[];
  projectRecordPath: string;
  recordedAt: string;
}

export interface PersistentProjectPromotionResult {
  readOnly: true;
  evidence: PersistentProjectRealityEvidence;
  projectRecord: PersistentProjectRecord;
  fileIndex: PersistentProjectFileIndex;
  exportMetadata: PersistentProjectExportMetadata;
}
