/**
 * Project Name Conflict Resolution V1 — apply resolution and record evidence.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createRegistryProject,
  resolveProjectRegistryRootDir,
  setRegistryActiveProject,
  type ProjectRegistryRecord,
} from '../project-registry-v1/index.js';
import { setActiveProjectId } from '../one-prompt-live-preview/workspace-tab-registry.js';
import { persistentProjectPaths } from '../persistent-project-reality/persistent-project-reality-paths.js';
import { deriveProjectNameFromPrompt } from '../project-session-continuity-v1/index.js';
import type {
  ProjectIdentityContract,
  ProjectNameConflictEvidenceRecord,
  ProjectNameConflictResolutionInput,
} from './project-name-conflict-resolution-types.js';
import { PROJECT_NAME_CONFLICT_RESOLUTION_CONTRACT_VERSION } from './project-name-conflict-resolution-types.js';
import {
  resolveProjectNameConflict,
  resolveRegistryTierRootForProjectId,
  resolveWorkspacePathForProject,
} from './project-name-conflict-resolver.js';

export class ProjectNameConflictRejectedError extends Error {
  readonly identity: ProjectIdentityContract;

  constructor(identity: ProjectIdentityContract) {
    super(identity.reason);
    this.name = 'ProjectNameConflictRejectedError';
    this.identity = identity;
  }
}

function resolveConflictStorageRoot(rootDir?: string): string {
  if (rootDir?.trim()) return rootDir;
  return resolveProjectRegistryRootDir();
}

function ensureConflictEvidenceDir(rootDir?: string): string {
  const base = join(
    resolveConflictStorageRoot(rootDir),
    '.aidevengine',
    'project-name-conflict-resolution',
  );
  if (!existsSync(base)) {
    mkdirSync(base, { recursive: true });
  }
  return base;
}

export function recordProjectNameConflictEvidence(
  identity: ProjectIdentityContract,
  input?: { rootDir?: string; repoRootDir?: string; previewUrl?: string | null },
): ProjectNameConflictEvidenceRecord {
  const repoRootDir = input?.repoRootDir ?? process.cwd();
  const paths = persistentProjectPaths(repoRootDir, identity.projectId);
  const evidence: ProjectNameConflictEvidenceRecord = {
    readOnly: true,
    contractVersion: PROJECT_NAME_CONFLICT_RESOLUTION_CONTRACT_VERSION,
    recordedAt: new Date().toISOString(),
    identity,
    featureRegistryEntry: existsSync(paths.featureContract)
      ? paths.featureContract
      : 'pending-feature-registry',
    routeRegistryEntry: existsSync(join(paths.source, 'src/features/routes.ts'))
      ? join(paths.source, 'src/features/routes.ts')
      : 'pending-route-registry',
    manifestUpdated: existsSync(paths.manifest),
    buildHistoryRecorded: existsSync(paths.buildHistoryLinks),
    workspaceRealityAudited: existsSync(paths.workspaceRealityAudit),
    projectSourcePath: existsSync(paths.source) ? paths.source : null,
    livePreviewProof: input?.previewUrl ?? null,
  };

  const dir = ensureConflictEvidenceDir(input?.rootDir);
  const file = join(dir, `${identity.projectId}-${Date.now()}.json`);
  writeFileSync(file, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  return evidence;
}

export function applyProjectIdentityForBuild(
  input: ProjectNameConflictResolutionInput,
): ProjectIdentityContract {
  const plan = resolveProjectNameConflict(input);
  if (plan.shouldFail) {
    const rejected: ProjectIdentityContract = {
      readOnly: true,
      requestedName: plan.requestedName,
      resolvedProjectName: plan.resolvedProjectName,
      projectId: plan.projectId ?? plan.existingProjectId ?? '',
      workspacePath: plan.workspacePath,
      resolutionMode: plan.resolutionMode,
      conflictFound: plan.conflictFound,
      continuationAllowed: plan.continuationAllowed,
      reason: plan.reason,
      existingProjectId: plan.existingProjectId ?? null,
      createdProject: false,
    };
    throw new ProjectNameConflictRejectedError(rejected);
  }

  const repoRootDir = input.repoRootDir ?? process.cwd();
  let record: ProjectRegistryRecord;
  let createdProject = false;

  if (plan.shouldCreateProject) {
    record = createRegistryProject({
      name: plan.resolvedProjectName,
      summary: input.summary ?? input.rawPrompt?.slice(0, 160),
      rootDir: input.rootDir,
      projectKind: 'USER',
    });
    createdProject = true;
  } else {
    const located = resolveRegistryTierRootForProjectId(plan.projectId!, input.rootDir);
    if (!located) {
      throw new Error(`Conflict resolution target project not found: ${plan.projectId}`);
    }
    record = located.record;
    setRegistryActiveProject({ projectId: record.projectId, rootDir: located.tierRoot });
  }

  setActiveProjectId(record.projectId);

  const identity: ProjectIdentityContract = {
    readOnly: true,
    requestedName: plan.requestedName,
    resolvedProjectName: record.name,
    projectId: record.projectId,
    workspacePath: resolveWorkspacePathForProject(record.projectId, repoRootDir),
    resolutionMode: plan.resolutionMode,
    conflictFound: plan.conflictFound,
    continuationAllowed: plan.continuationAllowed,
    reason: plan.reason,
    existingProjectId: plan.existingProjectId ?? null,
    createdProject,
  };

  recordProjectNameConflictEvidence(identity, { rootDir: input.rootDir, repoRootDir });
  return identity;
}

export function resolveRequestedProjectName(body: Record<string, unknown>, fallbackPrompt?: string): string {
  for (const field of ['projectName', 'name', 'requestedName'] as const) {
    const raw = body[field];
    if (typeof raw === 'string' && raw.trim()) {
      return raw.trim();
    }
  }
  if (fallbackPrompt?.trim()) {
    return deriveProjectNameFromPrompt(fallbackPrompt.trim());
  }
  return '';
}
