/**
 * Project Lifecycle Management V1 — delete, duplicate, restore operations.
 */

import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createRegistryProject,
  getRegistryProject,
  invalidateProjectRegistryV1Cache,
  readProjectRegistryState,
  validateCreateRegistryProjectName,
} from '../project-registry-v1/project-registry-v1-store.js';
import { persistentProjectPaths } from '../persistent-project-reality/persistent-project-reality-paths.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import { discoverProjectArtifacts, isPathSafeToDelete } from './project-artifact-discovery.js';
import {
  listOwnershipArtifactsForProject,
  registerProjectOwnershipArtifact,
  removeOwnershipArtifactsForProject,
} from './project-ownership-index.js';
import { auditProjectOwnership } from './project-ownership-auditor.js';
import { teardownProjectRuntime } from './project-runtime-teardown.js';
import type {
  PersistentProjectJsonShape,
  ProjectDeleteAuditStep,
  ProjectDeleteResult,
  ProjectDuplicateResult,
  ProjectRestoreResult,
} from './project-lifecycle-types.js';
import { PROJECT_DELETED_SUCCESSFULLY } from './project-lifecycle-types.js';

function removePath(rootDir: string, relPath: string): ProjectDeleteAuditStep {
  const normalized = relPath.replace(/\\/g, '/');
  if (normalized.includes('#')) {
    return {
      readOnly: true,
      label: 'Registry entry',
      path: normalized,
      status: 'SKIPPED',
      detail: 'Registry entry removed with project record',
    };
  }
  if (!isPathSafeToDelete(normalized)) {
    return {
      readOnly: true,
      label: normalized,
      path: normalized,
      status: 'SKIPPED',
      detail: 'Shared system resource — not deleted',
    };
  }
  const abs = join(rootDir, normalized);
  if (!existsSync(abs)) {
    return {
      readOnly: true,
      label: normalized,
      path: normalized,
      status: 'NOT_FOUND',
      detail: null,
    };
  }
  try {
    rmSync(abs, { recursive: true, force: true });
    return {
      readOnly: true,
      label: normalized,
      path: normalized,
      status: 'REMOVED',
      detail: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      readOnly: true,
      label: normalized,
      path: normalized,
      status: 'FAILED',
      detail: message,
    };
  }
}

function removeRegistryEntry(projectId: string, rootDir: string): void {
  const state = readProjectRegistryState(rootDir);
  const idx = state.projects.findIndex((p) => p.projectId === projectId);
  if (idx < 0) return;
  state.projects.splice(idx, 1);
  if (state.activeProjectId === projectId) {
    const next = state.projects.find((p) => p.status === 'ACTIVE');
    state.activeProjectId = next?.projectId ?? null;
  }
  const path = join(rootDir, '.aidevengine', 'project-registry-v1.json');
  writeFileSync(path, JSON.stringify(state, null, 2), 'utf8');
  invalidateProjectRegistryV1Cache();
}

function labelForArtifactType(type: string): string {
  const labels: Record<string, string> = {
    REGISTRY_ENTRY: 'Project registry',
    PERSISTENT_WORKSPACE: 'Persistent workspace',
    GENERATED_BUILDER_WORKSPACE: 'Generated builder workspace',
    GENERATED_SOURCE: 'Generated source',
    MANIFEST: 'Manifest',
    FEATURE_REGISTRY: 'Feature registry',
    METADATA: 'Metadata',
    BUILD_HISTORY: 'Build history',
    FAILED_SNAPSHOT: 'Failed snapshot',
    EXPORT_ARTIFACT: 'Export metadata',
    MATERIALIZATION_REPORT: 'Materialization report',
    FEATURE_REALITY: 'Feature reality',
    WORKSPACE_REALITY: 'Workspace reality',
    PRODUCTION_PROOF: 'Production proof',
    AUDIT_LOG: 'Audit log',
  };
  return labels[type] ?? type;
}

export async function deleteProjectLifecycle(input: {
  projectId: string;
  rootDir: string;
  confirmed?: boolean;
}): Promise<ProjectDeleteResult> {
  if (!input.confirmed) {
    return {
      readOnly: true,
      ok: false,
      projectId: input.projectId,
      projectName: '',
      token: null,
      auditSteps: [],
      orphanedFilesDetected: [],
      runtimeTeardown: {
        devServersStopped: 0,
        previewSessionsClosed: 0,
        workspaceSessionRemoved: false,
        activeProjectCleared: false,
      },
      error: 'Deletion requires explicit confirmation',
    };
  }

  const record = getRegistryProject(input.projectId, input.rootDir);
  const projectName = record?.name ?? input.projectId;
  const runtimeTeardown = await teardownProjectRuntime(input.projectId);

  const discovery = discoverProjectArtifacts(input.projectId, input.rootDir);
  const pathsToDelete = discovery.artifacts
    .filter((a) => a.exclusive && !a.path.includes('#'))
    .map((a) => a.path)
    .sort((a, b) => b.length - a.length);

  const auditSteps: ProjectDeleteAuditStep[] = [];
  for (const path of pathsToDelete) {
    const step = removePath(input.rootDir, path);
    step.label = labelForArtifactType(
      discovery.artifacts.find((a) => a.path === path)?.artifactType ?? 'artifact',
    );
    auditSteps.push(step);
  }

  removeRegistryEntry(input.projectId, input.rootDir);
  auditSteps.push({
    readOnly: true,
    label: 'Project registry',
    path: `.aidevengine/project-registry-v1.json#${input.projectId}`,
    status: 'REMOVED',
    detail: null,
  });

  removeOwnershipArtifactsForProject(input.projectId, input.rootDir);

  const postAudit = auditProjectOwnership(input.rootDir);
  const failed = auditSteps.some((s) => s.status === 'FAILED');

  return {
    readOnly: true,
    ok: !failed,
    projectId: input.projectId,
    projectName,
    token: failed ? null : PROJECT_DELETED_SUCCESSFULLY,
    auditSteps,
    orphanedFilesDetected: postAudit.orphans.map((o) => o.path),
    runtimeTeardown,
    error: failed ? 'One or more artifact removals failed' : null,
  };
}

export function duplicateProjectLifecycle(input: {
  sourceProjectId: string;
  rootDir: string;
  newName?: string;
}): ProjectDuplicateResult {
  const source = getRegistryProject(input.sourceProjectId, input.rootDir);
  if (!source) {
    return {
      readOnly: true,
      ok: false,
      sourceProjectId: input.sourceProjectId,
      newProjectId: '',
      newProjectName: '',
      copiedArtifacts: [],
      error: 'Source project not found',
    };
  }

  const baseName = input.newName?.trim() || `${source.name} Copy`;
  let newName = baseName;
  try {
    validateCreateRegistryProjectName(newName, input.rootDir);
  } catch {
    newName = `${baseName} ${Date.now().toString().slice(-4)}`;
  }

  const newRecord = createRegistryProject({
    name: newName,
    summary: source.summary ? `Copy of ${source.name} — ${source.summary}` : `Copy of ${source.name}`,
    rootDir: input.rootDir,
  });

  const copiedArtifacts: string[] = [];
  const sourcePersistent = persistentProjectPaths(input.rootDir, input.sourceProjectId);
  const targetPersistent = persistentProjectPaths(input.rootDir, newRecord.projectId);

  if (existsSync(sourcePersistent.root)) {
    cpSync(sourcePersistent.root, targetPersistent.root, { recursive: true });
    copiedArtifacts.push(`.aidev-projects/${newRecord.projectId}`);

    if (existsSync(targetPersistent.projectJson)) {
      try {
        const parsed = JSON.parse(
          readFileSync(targetPersistent.projectJson, 'utf8'),
        ) as PersistentProjectJsonShape;
        parsed.projectId = newRecord.projectId;
        parsed.projectName = newRecord.name;
        writeFileSync(targetPersistent.projectJson, JSON.stringify(parsed, null, 2), 'utf8');
      } catch {
        // Best-effort relink
      }
    }
  }

  const sourceBuilder = join(input.rootDir, GENERATED_BUILDER_WORKSPACES_DIR, input.sourceProjectId);
  const targetBuilder = join(input.rootDir, GENERATED_BUILDER_WORKSPACES_DIR, newRecord.projectId);
  if (existsSync(sourceBuilder)) {
    cpSync(sourceBuilder, targetBuilder, { recursive: true });
    copiedArtifacts.push(`${GENERATED_BUILDER_WORKSPACES_DIR}/${newRecord.projectId}`);
  }

  for (const path of copiedArtifacts) {
    registerProjectOwnershipArtifact({
      projectId: newRecord.projectId,
      path,
      artifactType: path.includes('aidev-projects') ? 'PERSISTENT_WORKSPACE' : 'GENERATED_BUILDER_WORKSPACE',
      rootDir: input.rootDir,
    });
  }

  return {
    readOnly: true,
    ok: true,
    sourceProjectId: input.sourceProjectId,
    newProjectId: newRecord.projectId,
    newProjectName: newRecord.name,
    copiedArtifacts,
    error: null,
  };
}

export function restoreProjectLifecycle(input: {
  projectId: string;
  rootDir: string;
}): ProjectRestoreResult {
  const state = readProjectRegistryState(input.rootDir);
  const record = state.projects.find((p) => p.projectId === input.projectId);
  if (!record) {
    return {
      readOnly: true,
      ok: false,
      projectId: input.projectId,
      workspaceValid: false,
      registryRelinked: false,
      warnings: [],
      error: 'Project not found',
    };
  }
  if (record.status !== 'ARCHIVED') {
    return {
      readOnly: true,
      ok: true,
      projectId: input.projectId,
      workspaceValid: true,
      registryRelinked: false,
      warnings: ['Project is already active'],
      error: null,
    };
  }

  const warnings: string[] = [];
  try {
    validateCreateRegistryProjectName(record.name, input.rootDir);
  } catch {
    warnings.push('An active project already uses this name — restore may cause duplicate-name repair on next load');
  }

  const paths = persistentProjectPaths(input.rootDir, input.projectId);
  const workspaceValid = existsSync(paths.root);
  if (!workspaceValid) {
    warnings.push('Persistent workspace not found on disk');
  }

  record.status = 'ACTIVE';
  record.updatedAt = new Date().toISOString();
  record.lastActivityAt = record.updatedAt;
  if (!record.persistentWorkspacePath && workspaceValid) {
    record.persistentWorkspacePath = `.aidev-projects/${input.projectId}`;
  }
  if (!record.sourceRoot && existsSync(paths.source)) {
    record.sourceRoot = `.aidev-projects/${input.projectId}/source`;
  }
  if (!record.aidevMetadataPath && existsSync(paths.aidev)) {
    record.aidevMetadataPath = `.aidev-projects/${input.projectId}/.aidev`;
  }

  const path = join(input.rootDir, '.aidevengine', 'project-registry-v1.json');
  writeFileSync(path, JSON.stringify(state, null, 2), 'utf8');
  invalidateProjectRegistryV1Cache();

  for (const owned of listOwnershipArtifactsForProject(input.projectId, input.rootDir)) {
    registerProjectOwnershipArtifact({
      projectId: input.projectId,
      path: owned.path,
      artifactType: owned.artifactType,
      lifecycleState: 'ACTIVE',
      rootDir: input.rootDir,
    });
  }

  return {
    readOnly: true,
    ok: true,
    projectId: input.projectId,
    workspaceValid,
    registryRelinked: true,
    warnings,
    error: null,
  };
}
