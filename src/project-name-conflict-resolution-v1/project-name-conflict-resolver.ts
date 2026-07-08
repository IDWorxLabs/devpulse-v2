/**
 * Project Name Conflict Resolution V1 — deterministic resolver for duplicate project names.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import {
  isUserFacingRegistryProject,
  readProjectRegistryState,
  resolveProjectRegistryRootDir,
  type ProjectRegistryRecord,
} from '../project-registry-v1/index.js';
import {
  classifyRegistryProject,
  normalizeProjectRegistryName,
} from '../project-registry-sovereignty/registry-classifier.js';
import {
  resolveSystemRegistryRoot,
  resolveUserRegistryRoot,
} from '../project-registry-sovereignty/registry-tier-paths.js';
import { deriveProjectBuildState } from '../project-resume-state/index.js';
import type {
  ProjectNameConflictResolutionInput,
  ProjectNameConflictResolutionMode,
  ProjectNameConflictResolutionPlan,
} from './project-name-conflict-resolution-types.js';

const RECOVERY_STATES = new Set([
  'FAILED',
  'STALE',
  'REPAIRABLE',
  'PARTIAL',
  'NEEDS_WORK',
  'DUPLICATE_RISK',
]);

function normalizeName(name: string): string {
  return normalizeProjectRegistryName(name);
}

export function resolveWorkspacePathForProject(projectId: string, repoRootDir?: string): string | null {
  const root = repoRootDir ?? process.cwd();
  const rel = `${GENERATED_BUILDER_WORKSPACES_DIR}/${projectId}`.replace(/\\/g, '/');
  const abs = join(root, rel);
  return existsSync(abs) ? rel : rel;
}

function listBuildConflictRegistryTierRoots(rootDir?: string): string[] {
  return [resolveUserRegistryRoot(rootDir), resolveSystemRegistryRoot(rootDir)];
}

export function resolveRegistryTierRootForProjectId(
  projectId: string,
  rootDir?: string,
): { record: ProjectRegistryRecord; tierRoot: string } | null {
  for (const tierRoot of listBuildConflictRegistryTierRoots(rootDir)) {
    const record = readProjectRegistryState(tierRoot).projects.find(
      (project) => project.projectId === projectId,
    );
    if (record) {
      return { record, tierRoot };
    }
  }
  return null;
}

export function findExistingUserProjectByName(
  requestedName: string,
  rootDir?: string,
): ProjectRegistryRecord | null {
  const normalized = normalizeName(requestedName);
  if (!normalized) return null;

  const candidates: ProjectRegistryRecord[] = [];
  for (const tierRoot of listBuildConflictRegistryTierRoots(rootDir)) {
    for (const project of readProjectRegistryState(tierRoot).projects) {
      if (project.status !== 'ACTIVE') continue;
      if (normalizeName(project.name) !== normalized) continue;
      if (classifyRegistryProject(project) === 'AUDIT') continue;
      candidates.push(project);
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const aUserFacing = isUserFacingRegistryProject(a) ? 0 : 1;
    const bUserFacing = isUserFacingRegistryProject(b) ? 0 : 1;
    if (aUserFacing !== bUserFacing) return aUserFacing - bUserFacing;
    return b.lastActivityAt.localeCompare(a.lastActivityAt);
  });
  return candidates[0] ?? null;
}

export function promptRequestsFreshRebuild(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\b(fresh build|fresh copy|rebuild|from scratch|start over|new version|versioned rebuild)\b/.test(
      lower,
    ) || /\b(v2|v3)\b/.test(lower)
  );
}

export function deriveVersionedRebuildName(baseName: string, rootDir?: string): string {
  const trimmed = baseName.trim() || 'Project';
  const candidates = [
    `${trimmed}-rebuild`,
    `${trimmed}-v2`,
    `${trimmed}-v3`,
    `${trimmed} (rebuild)`,
  ];
  for (const candidate of candidates) {
    if (!findExistingUserProjectByName(candidate, rootDir)) {
      return candidate;
    }
  }
  return `${trimmed}-rebuild-${Date.now()}`;
}

function classifyExistingProjectMode(
  projectId: string,
  rootDir?: string,
): ProjectNameConflictResolutionMode {
  const buildState = deriveProjectBuildState(projectId, rootDir);
  const state = buildState?.buildState ?? 'NEEDS_WORK';
  if (RECOVERY_STATES.has(state)) {
    return 'EXISTING_PROJECT_RECOVERY';
  }
  return 'EXISTING_PROJECT_CONTINUATION';
}

export function resolveProjectNameConflict(
  input: ProjectNameConflictResolutionInput,
): ProjectNameConflictResolutionPlan {
  const requestedName = String(input.requestedName ?? '').trim();
  if (!requestedName) {
    return {
      readOnly: true,
      requestedName: '',
      resolvedProjectName: '',
      projectId: null,
      workspacePath: null,
      resolutionMode: 'EXPLICIT_REJECTION',
      conflictFound: false,
      continuationAllowed: false,
      reason: 'Project name is required.',
      shouldCreateProject: false,
      shouldFail: true,
    };
  }

  const repoRootDir = input.repoRootDir ?? resolveProjectRegistryRootDir();
  const existing = findExistingUserProjectByName(requestedName, input.rootDir);

  if (input.rejectDuplicates === true && existing) {
    return {
      readOnly: true,
      requestedName,
      resolvedProjectName: requestedName,
      projectId: existing.projectId,
      workspacePath: resolveWorkspacePathForProject(existing.projectId, repoRootDir),
      resolutionMode: 'EXPLICIT_REJECTION',
      conflictFound: true,
      continuationAllowed: false,
      reason: 'Duplicate project name rejected by explicit instruction.',
      existingProjectId: existing.projectId,
      shouldCreateProject: false,
      shouldFail: true,
    };
  }

  if (!existing) {
    return {
      readOnly: true,
      requestedName,
      resolvedProjectName: requestedName,
      projectId: null,
      workspacePath: null,
      resolutionMode: 'NO_CONFLICT',
      conflictFound: false,
      continuationAllowed: true,
      reason: 'No active project uses this name — creating a new project.',
      shouldCreateProject: true,
      shouldFail: false,
    };
  }

  if (
    input.forceFreshRebuild === true ||
    input.confirmFreshCopy === true ||
    promptRequestsFreshRebuild(input.rawPrompt ?? '')
  ) {
    const versionedName = deriveVersionedRebuildName(requestedName, input.rootDir);
    return {
      readOnly: true,
      requestedName,
      resolvedProjectName: versionedName,
      projectId: null,
      workspacePath: null,
      resolutionMode: 'VERSIONED_REBUILD',
      conflictFound: true,
      continuationAllowed: true,
      reason: `Fresh rebuild requested — creating versioned project "${versionedName}".`,
      existingProjectId: existing.projectId,
      shouldCreateProject: true,
      shouldFail: false,
    };
  }

  const resolutionMode = classifyExistingProjectMode(existing.projectId, input.rootDir);
  const reason =
    resolutionMode === 'EXISTING_PROJECT_RECOVERY'
      ? `Existing project "${existing.name}" is incomplete or needs recovery — continuing build with repair path.`
      : `Existing project "${existing.name}" is active and usable — continuing build in place.`;

  return {
    readOnly: true,
    requestedName,
    resolvedProjectName: existing.name,
    projectId: existing.projectId,
    workspacePath: resolveWorkspacePathForProject(existing.projectId, repoRootDir),
    resolutionMode,
    conflictFound: true,
    continuationAllowed: true,
    reason,
    existingProjectId: existing.projectId,
    shouldCreateProject: false,
    shouldFail: false,
  };
}
