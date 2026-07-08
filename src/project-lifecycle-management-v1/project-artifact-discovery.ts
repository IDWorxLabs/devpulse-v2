/**
 * Project Lifecycle Management V1 — intelligent artifact discovery for a project.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import { GENERATED_BUILD_HISTORY_DIR } from '../build-history-integrity/build-history-types.js';
import { persistentProjectPaths } from '../persistent-project-reality/persistent-project-reality-paths.js';
import { PERSISTENT_PROJECTS_DIR } from '../persistent-project-reality/persistent-project-reality-types.js';
import {
  getRegistryProject,
  readProjectRegistryState,
} from '../project-registry-v1/project-registry-v1-store.js';
import type {
  PersistentProjectJsonShape,
  ProjectArtifactDiscoveryResult,
  ProjectArtifactType,
  ProjectOwnershipArtifact,
} from './project-lifecycle-types.js';
import { listOwnershipArtifactsForProject, registerProjectOwnershipArtifact } from './project-ownership-index.js';

const SHARED_SYSTEM_PREFIXES = [
  'src/',
  'server/',
  'public/founder-reality/',
  'architecture/',
  'node_modules/',
  '.git/',
] as const;

function rel(rootDir: string, absoluteOrRel: string): string {
  const root = rootDir.replace(/\\/g, '/');
  const path = absoluteOrRel.replace(/\\/g, '/');
  if (path.startsWith(root)) return path.slice(root.length + 1);
  return path.replace(/^\.\//, '');
}

function isSharedSystemPath(path: string): boolean {
  const normalized = path.replace(/\\/g, '/');
  return SHARED_SYSTEM_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function artifact(
  projectId: string,
  path: string,
  artifactType: ProjectArtifactType,
  exclusive = true,
): ProjectOwnershipArtifact {
  return {
    readOnly: true,
    artifactId: `discovered-${artifactType}-${path}`,
    projectId,
    owner: 'project-artifact-discovery',
    artifactType,
    path: path.replace(/\\/g, '/'),
    createdAt: new Date().toISOString(),
    lifecycleState: 'ACTIVE',
    exclusive,
  };
}

function readPersistentProjectJson(
  rootDir: string,
  projectId: string,
): PersistentProjectJsonShape | null {
  const paths = persistentProjectPaths(rootDir, projectId);
  if (!existsSync(paths.projectJson)) return null;
  try {
    return JSON.parse(readFileSync(paths.projectJson, 'utf8')) as PersistentProjectJsonShape;
  } catch {
    return null;
  }
}

function collectPathArtifacts(
  projectId: string,
  rootDir: string,
  pathValue: string | null | undefined,
  artifactType: ProjectArtifactType,
  bucket: ProjectOwnershipArtifact[],
): void {
  if (!pathValue?.trim()) return;
  const normalized = rel(rootDir, pathValue.trim());
  if (isSharedSystemPath(normalized)) return;
  bucket.push(artifact(projectId, normalized, artifactType));
}

function collectBuildHistoryRun(
  projectId: string,
  rootDir: string,
  runPath: string,
  bucket: ProjectOwnershipArtifact[],
): void {
  const normalized = rel(rootDir, runPath);
  if (!normalized.startsWith(`${GENERATED_BUILD_HISTORY_DIR}/`)) return;
  bucket.push(artifact(projectId, normalized, 'BUILD_HISTORY'));
}

export function discoverProjectArtifacts(
  projectId: string,
  rootDir: string,
): ProjectArtifactDiscoveryResult {
  const artifacts: ProjectOwnershipArtifact[] = [];
  const seen = new Set<string>();

  function add(a: ProjectOwnershipArtifact): void {
    if (seen.has(a.path)) return;
    seen.add(a.path);
    artifacts.push(a);
  }

  const registryRecord = getRegistryProject(projectId, rootDir);
  if (registryRecord) {
    add(artifact(projectId, `.aidevengine/project-registry-v1.json#${projectId}`, 'REGISTRY_ENTRY', false));
  }

  const persistentRoot = `${PERSISTENT_PROJECTS_DIR}/${projectId}`;
  const builderWorkspace = `${GENERATED_BUILDER_WORKSPACES_DIR}/${projectId}`;

  if (existsSync(join(rootDir, persistentRoot))) {
    add(artifact(projectId, persistentRoot, 'PERSISTENT_WORKSPACE'));
  }
  if (existsSync(join(rootDir, builderWorkspace))) {
    add(artifact(projectId, builderWorkspace, 'GENERATED_BUILDER_WORKSPACE'));
  }

  const paths = persistentProjectPaths(rootDir, projectId);
  const persistentJson = readPersistentProjectJson(rootDir, projectId);

  if (existsSync(paths.source)) {
    add(artifact(projectId, rel(rootDir, paths.source), 'GENERATED_SOURCE'));
  }
  if (existsSync(paths.manifest)) {
    add(artifact(projectId, rel(rootDir, paths.manifest), 'MANIFEST'));
  }
  if (existsSync(paths.featureContract)) {
    add(artifact(projectId, rel(rootDir, paths.featureContract), 'FEATURE_REGISTRY'));
  }
  if (existsSync(paths.aidev)) {
    add(artifact(projectId, rel(rootDir, paths.aidev), 'METADATA'));
  }
  if (existsSync(paths.materializationQualityScore)) {
    add(artifact(projectId, rel(rootDir, paths.materializationQualityScore), 'MATERIALIZATION_REPORT'));
  }
  if (existsSync(paths.featureContractReality)) {
    add(artifact(projectId, rel(rootDir, paths.featureContractReality), 'FEATURE_REALITY'));
  }
  if (existsSync(paths.workspaceRealityAudit)) {
    add(artifact(projectId, rel(rootDir, paths.workspaceRealityAudit), 'WORKSPACE_REALITY'));
  }
  if (existsSync(paths.productionValidation)) {
    add(artifact(projectId, rel(rootDir, paths.productionValidation), 'PRODUCTION_PROOF'));
  }
  if (existsSync(paths.auditLog)) {
    add(artifact(projectId, rel(rootDir, paths.auditLog), 'AUDIT_LOG'));
  }
  if (existsSync(paths.exportMetadata)) {
    add(artifact(projectId, rel(rootDir, paths.exportMetadata), 'EXPORT_ARTIFACT'));
  }
  if (existsSync(paths.snapshotsDir)) {
    add(artifact(projectId, rel(rootDir, paths.snapshotsDir), 'FAILED_SNAPSHOT'));
  }

  if (persistentJson) {
    collectPathArtifacts(projectId, rootDir, persistentJson.buildHistoryRecordPath, 'BUILD_HISTORY', artifacts);
    collectPathArtifacts(projectId, rootDir, persistentJson.lastFailedSnapshotPath, 'FAILED_SNAPSHOT', artifacts);
    collectPathArtifacts(projectId, rootDir, persistentJson.manifestPath, 'MANIFEST', artifacts);
    collectPathArtifacts(projectId, rootDir, persistentJson.featureContractPath, 'FEATURE_REGISTRY', artifacts);
    collectPathArtifacts(projectId, rootDir, persistentJson.exportMetadataPath, 'EXPORT_ARTIFACT', artifacts);
    collectPathArtifacts(projectId, rootDir, persistentJson.projectFileIndexPath, 'METADATA', artifacts);
    collectPathArtifacts(projectId, rootDir, persistentJson.productionValidationPath, 'PRODUCTION_PROOF', artifacts);
    collectPathArtifacts(projectId, rootDir, persistentJson.materializationQualityScorePath, 'MATERIALIZATION_REPORT', artifacts);
    collectPathArtifacts(projectId, rootDir, persistentJson.featureContractRealityPath, 'FEATURE_REALITY', artifacts);
    collectPathArtifacts(projectId, rootDir, persistentJson.workspaceRealityAuditPath, 'WORKSPACE_REALITY', artifacts);
    for (const link of persistentJson.immutableBuildLinks ?? []) {
      collectBuildHistoryRun(projectId, rootDir, link, artifacts);
    }
  }

  if (registryRecord?.activeBuildHistoryRunId) {
    collectBuildHistoryRun(
      projectId,
      rootDir,
      `${GENERATED_BUILD_HISTORY_DIR}/${registryRecord.activeBuildHistoryRunId}`,
      artifacts,
    );
  }
  if (registryRecord?.lastSuccessfulBuildRunId) {
    collectBuildHistoryRun(
      projectId,
      rootDir,
      `${GENERATED_BUILD_HISTORY_DIR}/${registryRecord.lastSuccessfulBuildRunId}`,
      artifacts,
    );
  }

  for (const owned of listOwnershipArtifactsForProject(projectId, rootDir)) {
    add(owned);
  }

  for (const a of artifacts) {
    registerProjectOwnershipArtifact({
      projectId: a.projectId,
      path: a.path,
      artifactType: a.artifactType,
      lifecycleState: a.lifecycleState,
      exclusive: a.exclusive,
      rootDir,
    });
  }

  return { readOnly: true, projectId, artifacts };
}

export function isPathSafeToDelete(path: string): boolean {
  return !isSharedSystemPath(path);
}

export function listRegisteredProjectIds(rootDir: string): string[] {
  const state = readProjectRegistryState(rootDir);
  const ids = new Set(state.projects.map((p) => p.projectId));
  return [...ids];
}
