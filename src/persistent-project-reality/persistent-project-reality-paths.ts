/**
 * Persistent Project Reality V1 — path helpers.
 */

import { join } from 'node:path';
import {
  AIDEV_AUDIT_LOG_FILENAME,
  AIDEV_BUILD_HISTORY_LINKS_FILENAME,
  AIDEV_EXPORT_METADATA_FILENAME,
  AIDEV_FEATURE_CONTRACT_FILENAME,
  AIDEV_MANIFEST_FILENAME,
  AIDEV_MATERIALIZATION_QUALITY_SCORE_FILENAME,
  AIDEV_FEATURE_CONTRACT_REALITY_FILENAME,
  AIDEV_WORKSPACE_REALITY_AUDIT_FILENAME,
  AIDEV_METADATA_DIR,
  AIDEV_PRODUCTION_VALIDATION_FILENAME,
  AIDEV_PROJECT_FILE_INDEX_FILENAME,
  PERSISTENT_PROJECTS_DIR,
  PROJECT_JSON_FILENAME,
  SOURCE_DIR,
} from './persistent-project-reality-types.js';

export function persistentProjectRoot(projectRootDir: string, projectId: string): string {
  return join(projectRootDir, PERSISTENT_PROJECTS_DIR, projectId);
}

export function persistentProjectSourceRoot(projectRootDir: string, projectId: string): string {
  return join(persistentProjectRoot(projectRootDir, projectId), SOURCE_DIR);
}

export function persistentProjectAidevDir(projectRootDir: string, projectId: string): string {
  return join(persistentProjectRoot(projectRootDir, projectId), AIDEV_METADATA_DIR);
}

export function persistentProjectPaths(projectRootDir: string, projectId: string) {
  const root = persistentProjectRoot(projectRootDir, projectId);
  const source = join(root, SOURCE_DIR);
  const aidev = join(root, AIDEV_METADATA_DIR);
  return {
    root,
    source,
    aidev,
    projectJson: join(root, PROJECT_JSON_FILENAME),
    manifest: join(aidev, AIDEV_MANIFEST_FILENAME),
    featureContract: join(aidev, AIDEV_FEATURE_CONTRACT_FILENAME),
    productionValidation: join(aidev, AIDEV_PRODUCTION_VALIDATION_FILENAME),
    buildHistoryLinks: join(aidev, AIDEV_BUILD_HISTORY_LINKS_FILENAME),
    projectFileIndex: join(aidev, AIDEV_PROJECT_FILE_INDEX_FILENAME),
    exportMetadata: join(aidev, AIDEV_EXPORT_METADATA_FILENAME),
    materializationQualityScore: join(aidev, AIDEV_MATERIALIZATION_QUALITY_SCORE_FILENAME),
    featureContractReality: join(aidev, AIDEV_FEATURE_CONTRACT_REALITY_FILENAME),
    workspaceRealityAudit: join(aidev, AIDEV_WORKSPACE_REALITY_AUDIT_FILENAME),
    auditLog: join(aidev, AIDEV_AUDIT_LOG_FILENAME),
    snapshotsDir: join(aidev, 'snapshots'),
    versionsDir: join(aidev, 'versions'),
  };
}

export function relativeFromProjectRoot(projectRootDir: string, absolutePath: string): string {
  const root = projectRootDir.replace(/\\/g, '/');
  const abs = absolutePath.replace(/\\/g, '/');
  if (abs.startsWith(root)) return abs.slice(root.length + 1);
  return abs;
}
