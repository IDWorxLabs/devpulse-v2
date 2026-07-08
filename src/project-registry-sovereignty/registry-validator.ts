/**
 * Registry Sovereignty V1 — tier counts and constitutional assertions.
 */

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { readProjectRegistryState } from '../project-registry-v1/project-registry-v1-store.js';
import { PERSISTENT_PROJECTS_DIR } from '../persistent-project-reality/persistent-project-reality-types.js';
import { classifyRegistryProject } from './registry-classifier.js';
import {
  resolveArtifactRootForProjectKind,
  resolveAuditRegistryRoot,
  resolveRepoRoot,
  resolveSystemRegistryRoot,
  resolveUserRegistryRoot,
} from './registry-tier-paths.js';
import type { RegistryTierCounts } from './types.js';
import { registryClassToProjectKind } from './registry-classifier.js';

function emptyCounts(): RegistryTierCounts {
  return {
    readOnly: true,
    user: 0,
    audit: 0,
    system: 0,
    userActive: 0,
    persistentUser: 0,
    persistentTotal: 0,
  };
}

function loadTierCount(registryRoot: string): number {
  try {
    return readProjectRegistryState(registryRoot).projects.length;
  } catch {
    return 0;
  }
}

function countPersistentProjects(artifactRoot: string): number {
  const dir = join(artifactRoot, PERSISTENT_PROJECTS_DIR);
  if (!existsSync(dir)) return 0;
  return readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).length;
}

export function countRegistryTierProjects(rootDir?: string): RegistryTierCounts {
  const repoRoot = resolveRepoRoot(rootDir);
  const userState = readProjectRegistryState(resolveUserRegistryRoot(repoRoot));
  const userArtifactRoot = resolveArtifactRootForProjectKind(
    registryClassToProjectKind('USER'),
    repoRoot,
  );
  const userPersistent = countPersistentProjects(userArtifactRoot);
  const auditPersistent = countPersistentProjects(
    resolveArtifactRootForProjectKind(registryClassToProjectKind('AUDIT'), repoRoot),
  );
  const systemPersistent = countPersistentProjects(
    resolveArtifactRootForProjectKind(registryClassToProjectKind('SYSTEM'), repoRoot),
  );

  return {
    readOnly: true,
    user: userState.projects.length,
    audit: loadTierCount(resolveAuditRegistryRoot(repoRoot)),
    system: loadTierCount(resolveSystemRegistryRoot(repoRoot)),
    userActive: userState.projects.filter(
      (project) => project.status === 'ACTIVE' && classifyRegistryProject(project) === 'USER',
    ).length,
    persistentUser: userPersistent,
    persistentTotal: userPersistent + auditPersistent + systemPersistent,
  };
}

export function assertUserRegistryContainsOnlyUserProjects(
  rootDir?: string,
): { ok: boolean; violations: string[] } {
  const userState = readProjectRegistryState(resolveUserRegistryRoot(rootDir));
  const violations: string[] = [];

  for (const project of userState.projects) {
    if (classifyRegistryProject(project) !== 'USER') {
      violations.push(project.projectId);
    }
  }

  const active = userState.activeProjectId
    ? userState.projects.find((project) => project.projectId === userState.activeProjectId)
    : null;
  if (active && classifyRegistryProject(active) !== 'USER') {
    violations.push(`activeProjectId:${userState.activeProjectId}`);
  }

  return { ok: violations.length === 0, violations };
}

export function assertAuditRegistryContainsOnlyAuditProjects(
  rootDir?: string,
): { ok: boolean; violations: string[] } {
  const auditState = readProjectRegistryState(resolveAuditRegistryRoot(rootDir));
  const violations = auditState.projects
    .filter((project) => classifyRegistryProject(project) !== 'AUDIT')
    .map((project) => project.projectId);
  return { ok: violations.length === 0, violations };
}

export function assertSystemRegistryContainsOnlySystemProjects(
  rootDir?: string,
): { ok: boolean; violations: string[] } {
  const systemState = readProjectRegistryState(resolveSystemRegistryRoot(rootDir));
  const violations = systemState.projects
    .filter((project) => classifyRegistryProject(project) !== 'SYSTEM')
    .map((project) => project.projectId);
  return { ok: violations.length === 0, violations };
}

export function assertRegistrySovereignty(rootDir?: string): {
  ok: boolean;
  user: { ok: boolean; violations: string[] };
  audit: { ok: boolean; violations: string[] };
  system: { ok: boolean; violations: string[] };
  counts: RegistryTierCounts;
} {
  const user = assertUserRegistryContainsOnlyUserProjects(rootDir);
  const audit = assertAuditRegistryContainsOnlyAuditProjects(rootDir);
  const system = assertSystemRegistryContainsOnlySystemProjects(rootDir);
  return {
    ok: user.ok && audit.ok && system.ok,
    user,
    audit,
    system,
    counts: countRegistryTierProjects(rootDir),
  };
}
