/**
 * Registry Sovereignty V1 — integrity scan for polluted and stale registry state.
 */

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { readProjectRegistryState } from '../project-registry-v1/project-registry-v1-store.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import { listMultiProjectWorkspacesForRegistry } from '../one-prompt-live-preview/workspace-tab-registry.js';
import { classifyRegistryProject, normalizeProjectRegistryName } from './registry-classifier.js';
import {
  getAuditRegistryFilePath,
  getLegacyAuditValidationRegistryFilePath,
  getNestedTierRegistryFilePath,
  getSystemRegistryFilePath,
  getUserRegistryFilePath,
  resolveAuditRegistryRoot,
  resolveLegacyAuditValidationRegistryRoot,
  resolveRepoRoot,
  resolveSystemRegistryRoot,
  resolveUserRegistryRoot,
} from './registry-tier-paths.js';
import type { RegistryIntegrityIssue } from './types.js';

function scanDuplicateNormalizedNames(rootDir: string): RegistryIntegrityIssue[] {
  const issues: RegistryIntegrityIssue[] = [];
  const userState = readProjectRegistryState(resolveUserRegistryRoot(rootDir));
  const groups = new Map<string, string[]>();

  for (const project of userState.projects) {
    if (project.status !== 'ACTIVE') continue;
    if (classifyRegistryProject(project) !== 'USER') continue;
    const key = normalizeProjectRegistryName(project.name);
    const ids = groups.get(key) ?? [];
    ids.push(project.projectId);
    groups.set(key, ids);
  }

  for (const [normalizedName, projectIds] of groups) {
    if (projectIds.length <= 1) continue;
    issues.push({
      readOnly: true,
      code: 'DUPLICATE_NORMALIZED_NAME',
      detail: `${normalizedName}:${projectIds.join(',')}`,
      projectId: projectIds[0],
    });
  }

  return issues;
}

function scanMisclassifiedInUserRegistry(rootDir: string): RegistryIntegrityIssue[] {
  const issues: RegistryIntegrityIssue[] = [];
  const userState = readProjectRegistryState(resolveUserRegistryRoot(rootDir));

  for (const project of userState.projects) {
    const registryClass = classifyRegistryProject(project);
    if (registryClass === 'AUDIT') {
      issues.push({
        readOnly: true,
        code: 'AUDIT_IN_USER_REGISTRY',
        detail: project.projectId,
        projectId: project.projectId,
      });
    } else if (registryClass === 'SYSTEM') {
      issues.push({
        readOnly: true,
        code: 'SYSTEM_IN_USER_REGISTRY',
        detail: project.projectId,
        projectId: project.projectId,
      });
    }
  }

  const active = userState.activeProjectId
    ? userState.projects.find((project) => project.projectId === userState.activeProjectId)
    : null;
  if (active && classifyRegistryProject(active) !== 'USER') {
    issues.push({
      readOnly: true,
      code: 'INVALID_ACTIVE_PROJECT',
      detail: userState.activeProjectId ?? '',
      projectId: userState.activeProjectId ?? undefined,
    });
  }

  return issues;
}

function scanOrphanedUserWorkspaces(rootDir: string): RegistryIntegrityIssue[] {
  const issues: RegistryIntegrityIssue[] = [];
  const repoRoot = resolveRepoRoot(rootDir);
  const userActiveIds = new Set(
    readProjectRegistryState(resolveUserRegistryRoot(repoRoot))
      .projects.filter(
        (project) => project.status === 'ACTIVE' && classifyRegistryProject(project) === 'USER',
      )
      .map((project) => project.projectId),
  );

  const workspaceDir = join(repoRoot, GENERATED_BUILDER_WORKSPACES_DIR);
  if (existsSync(workspaceDir)) {
    for (const entry of readdirSync(workspaceDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (classifyRegistryProject({ projectId: entry.name }) !== 'USER') {
        issues.push({
          readOnly: true,
          code: 'ORPHANED_WORKSPACE',
          detail: entry.name,
          projectId: entry.name,
        });
        continue;
      }
      if (!userActiveIds.has(entry.name)) {
        issues.push({
          readOnly: true,
          code: 'ORPHANED_WORKSPACE',
          detail: entry.name,
          projectId: entry.name,
        });
      }
    }
  }

  return issues;
}

function scanStaleWorkspaceCache(rootDir: string): RegistryIntegrityIssue[] {
  const issues: RegistryIntegrityIssue[] = [];
  const userActiveIds = readProjectRegistryState(resolveUserRegistryRoot(rootDir))
    .projects.filter(
      (project) => project.status === 'ACTIVE' && classifyRegistryProject(project) === 'USER',
    )
    .map((project) => project.projectId);
  const cached = listMultiProjectWorkspacesForRegistry(userActiveIds);
  for (const session of cached) {
    if (!userActiveIds.includes(session.projectId)) {
      issues.push({
        readOnly: true,
        code: 'STALE_WORKSPACE_CACHE',
        detail: session.projectId,
        projectId: session.projectId,
      });
    }
  }
  return issues;
}

function scanNestedTierRegistryFiles(rootDir: string): RegistryIntegrityIssue[] {
  const issues: RegistryIntegrityIssue[] = [];
  const tierRoots = [
    resolveAuditRegistryRoot(rootDir),
    resolveSystemRegistryRoot(rootDir),
    resolveLegacyAuditValidationRegistryRoot(rootDir),
  ];

  for (const tierRoot of tierRoots) {
    const nested = getNestedTierRegistryFilePath(tierRoot);
    if (existsSync(nested)) {
      issues.push({
        readOnly: true,
        code: 'NESTED_TIER_REGISTRY_FILE',
        detail: nested,
      });
    }
  }

  void getUserRegistryFilePath(rootDir);
  void getAuditRegistryFilePath(rootDir);
  void getSystemRegistryFilePath(rootDir);
  void getLegacyAuditValidationRegistryFilePath(rootDir);

  return issues;
}

export function scanRegistryIntegrity(rootDir?: string): RegistryIntegrityIssue[] {
  const repoRoot = resolveRepoRoot(rootDir);
  return [
    ...scanMisclassifiedInUserRegistry(repoRoot),
    ...scanDuplicateNormalizedNames(repoRoot),
    ...scanOrphanedUserWorkspaces(repoRoot),
    ...scanStaleWorkspaceCache(repoRoot),
    ...scanNestedTierRegistryFiles(repoRoot),
  ];
}
