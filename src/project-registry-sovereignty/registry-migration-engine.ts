/**
 * Registry Sovereignty V1 — tier migration and nested registry file promotion.
 */

import { existsSync, readFileSync, renameSync } from 'node:fs';
import {
  invalidateProjectRegistryV1Cache,
  readProjectRegistryState,
  writeProjectRegistryV1ForTests,
  type ProjectRegistryFile,
  type ProjectRegistryRecord,
} from '../project-registry-v1/project-registry-v1-store.js';
import { classifyRegistryProject, registryClassToProjectKind } from './registry-classifier.js';
import { repairUserActiveProjectId } from './registry-active-project-authority.js';
import { repairDuplicateNormalizedNames } from './registry-repair-engine.js';
import {
  getLegacyAuditValidationRegistryFilePath,
  getNestedTierRegistryFilePath,
  getTierRegistryFilePath,
  isFlatTierRegistryRoot,
  resolveAuditRegistryRoot,
  resolveLegacyAuditValidationRegistryRoot,
  resolveRepoRoot,
  resolveSystemRegistryRoot,
  resolveUserRegistryRoot,
} from './registry-tier-paths.js';
import type { RegistrySovereigntyMigrationRecord, RegistrySovereigntyMigrationResult } from './types.js';
import { countRegistryTierProjects } from './registry-validator.js';

function emptyRegistryState(): ProjectRegistryFile {
  return { version: 1, activeProjectId: null, projects: [] };
}

function loadTierRegistry(registryRoot: string): ProjectRegistryFile {
  promoteNestedTierRegistryFile(registryRoot);
  try {
    return readProjectRegistryState(registryRoot);
  } catch {
    return emptyRegistryState();
  }
}

function promoteNestedTierRegistryFile(registryRoot: string): boolean {
  if (!isFlatTierRegistryRoot(registryRoot)) return false;
  const flatPath = getTierRegistryFilePath(registryRoot);
  const nestedPath = getNestedTierRegistryFilePath(registryRoot);
  if (existsSync(flatPath) || !existsSync(nestedPath)) return false;
  renameSync(nestedPath, flatPath);
  return true;
}

function mergeRecords(
  target: ProjectRegistryFile,
  incoming: readonly ProjectRegistryRecord[],
): void {
  const existingIds = new Set(target.projects.map((project) => project.projectId));
  for (const record of incoming) {
    const registryClass = classifyRegistryProject(record);
    const normalized = {
      ...record,
      projectKind: registryClassToProjectKind(registryClass),
    };
    if (existingIds.has(record.projectId)) {
      const index = target.projects.findIndex((project) => project.projectId === record.projectId);
      if (index >= 0) target.projects[index] = normalized;
      continue;
    }
    target.projects.push(normalized);
    existingIds.add(record.projectId);
  }
}

export function migratePollutedUserRegistry(rootDir?: string): RegistrySovereigntyMigrationResult {
  const repoRoot = resolveRepoRoot(rootDir);
  invalidateProjectRegistryV1Cache();

  const userRoot = resolveUserRegistryRoot(repoRoot);
  const userState = loadTierRegistry(userRoot);
  const previousActiveProjectId = userState.activeProjectId;
  const auditState = loadTierRegistry(resolveAuditRegistryRoot(repoRoot));
  const systemState = loadTierRegistry(resolveSystemRegistryRoot(repoRoot));
  const migrated: RegistrySovereigntyMigrationRecord[] = [];

  if (promoteNestedTierRegistryFile(resolveAuditRegistryRoot(repoRoot))) {
    migrated.push({
      readOnly: true,
      projectId: 'nested-audit-registry',
      name: 'nested-audit-registry',
      registryClass: 'AUDIT',
      projectKind: registryClassToProjectKind('AUDIT'),
      from: 'nested-tier-registry',
      to: 'audit-registry',
    });
  }
  if (promoteNestedTierRegistryFile(resolveSystemRegistryRoot(repoRoot))) {
    migrated.push({
      readOnly: true,
      projectId: 'nested-system-registry',
      name: 'nested-system-registry',
      registryClass: 'SYSTEM',
      projectKind: registryClassToProjectKind('SYSTEM'),
      from: 'nested-tier-registry',
      to: 'system-registry',
    });
  }

  const auditBucket: ProjectRegistryRecord[] = [];
  const systemBucket: ProjectRegistryRecord[] = [];
  const userBucket: ProjectRegistryRecord[] = [];

  for (const project of userState.projects) {
    const registryClass = classifyRegistryProject(project);
    const normalized = { ...project, projectKind: registryClassToProjectKind(registryClass) };
    if (registryClass === 'AUDIT') {
      auditBucket.push(normalized);
      migrated.push({
        readOnly: true,
        projectId: project.projectId,
        name: project.name,
        registryClass,
        projectKind: normalized.projectKind!,
        from: 'user-registry',
        to: 'audit-registry',
      });
      continue;
    }
    if (registryClass === 'SYSTEM') {
      systemBucket.push(normalized);
      migrated.push({
        readOnly: true,
        projectId: project.projectId,
        name: project.name,
        registryClass,
        projectKind: normalized.projectKind!,
        from: 'user-registry',
        to: 'system-registry',
      });
      continue;
    }
    userBucket.push(normalized);
  }

  const legacyPath = getLegacyAuditValidationRegistryFilePath(repoRoot);
  if (existsSync(legacyPath)) {
    const legacyRoot = resolveLegacyAuditValidationRegistryRoot(repoRoot);
    promoteNestedTierRegistryFile(legacyRoot);
    const legacyState = loadTierRegistry(legacyRoot);
    for (const project of legacyState.projects) {
      const registryClass = classifyRegistryProject(project);
      const normalized = {
        ...project,
        projectKind: registryClassToProjectKind(registryClass === 'USER' ? 'AUDIT' : registryClass),
      };
      if (registryClass === 'SYSTEM') {
        systemBucket.push(normalized);
        migrated.push({
          readOnly: true,
          projectId: project.projectId,
          name: project.name,
          registryClass: 'SYSTEM',
          projectKind: normalized.projectKind!,
          from: 'legacy-audit-registry',
          to: 'system-registry',
        });
      } else {
        auditBucket.push(normalized);
        migrated.push({
          readOnly: true,
          projectId: project.projectId,
          name: project.name,
          registryClass: 'AUDIT',
          projectKind: normalized.projectKind!,
          from: 'legacy-audit-registry',
          to: 'audit-registry',
        });
      }
    }
  }

  mergeRecords(auditState, auditBucket);
  mergeRecords(systemState, systemBucket);

  userState.projects = userBucket;
  const duplicateRepair = repairDuplicateNormalizedNames(userState);
  const repairedActiveProjectId = repairUserActiveProjectId(userState);

  const mutated =
    migrated.length > 0 ||
    duplicateRepair.mutated ||
    previousActiveProjectId !== repairedActiveProjectId;

  if (mutated) {
    writeProjectRegistryV1ForTests(userState, userRoot);
    writeProjectRegistryV1ForTests(auditState, resolveAuditRegistryRoot(repoRoot));
    writeProjectRegistryV1ForTests(systemState, resolveSystemRegistryRoot(repoRoot));
    invalidateProjectRegistryV1Cache();
  }

  return {
    readOnly: true,
    mutated,
    migrated,
    duplicateRepairs: duplicateRepair.repairs,
    repairedActiveProjectId,
    previousActiveProjectId,
    counts: countRegistryTierProjects(repoRoot),
  };
}

export function migrateNestedTierRegistryFiles(rootDir?: string): RegistrySovereigntyMigrationRecord[] {
  const repoRoot = resolveRepoRoot(rootDir);
  const migrated: RegistrySovereigntyMigrationRecord[] = [];
  for (const tierRoot of [
    resolveAuditRegistryRoot(repoRoot),
    resolveSystemRegistryRoot(repoRoot),
    resolveLegacyAuditValidationRegistryRoot(repoRoot),
  ]) {
    if (promoteNestedTierRegistryFile(tierRoot)) {
      migrated.push({
        readOnly: true,
        projectId: tierRoot,
        name: tierRoot,
        registryClass: tierRoot.includes('system') ? 'SYSTEM' : 'AUDIT',
        projectKind: registryClassToProjectKind(tierRoot.includes('system') ? 'SYSTEM' : 'AUDIT'),
        from: 'nested-tier-registry',
        to: tierRoot.includes('system') ? 'system-registry' : 'audit-registry',
      });
    }
  }
  return migrated;
}
