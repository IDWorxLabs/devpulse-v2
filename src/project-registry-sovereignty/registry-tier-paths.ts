/**
 * Registry Sovereignty V1 — physical tier registry paths.
 *
 * USER:   .aidevengine/project-registry-v1.json
 * AUDIT:  .aidevengine-audit/project-registry-v1.json
 * SYSTEM: .aidevengine-system/project-registry-v1.json
 */

import { join } from 'node:path';
import { resolveProjectRegistryRootDir } from '../project-registry-v1/project-registry-v1-store.js';
import {
  PROJECT_KIND_AUDIT,
  PROJECT_KIND_SYSTEM_TEST,
  PROJECT_KIND_USER,
  type ProjectKind,
} from '../project-registry-v1/project-kind.js';
import {
  LEGACY_AUDIT_VALIDATION_DIR,
  REGISTRY_TIER_AUDIT_DIR,
  REGISTRY_TIER_SYSTEM_DIR,
  type RegistryClass,
} from './types.js';
import { registryClassToProjectKind } from './registry-classifier.js';

const USER_REGISTRY_DIR = '.aidevengine';
const REGISTRY_FILE = 'project-registry-v1.json';

const FLAT_TIER_DIRS = [
  REGISTRY_TIER_AUDIT_DIR,
  REGISTRY_TIER_SYSTEM_DIR,
  LEGACY_AUDIT_VALIDATION_DIR,
] as const;

export function resolveRepoRoot(rootDir?: string): string {
  return rootDir?.trim() || resolveProjectRegistryRootDir();
}

export function resolveUserRegistryRoot(rootDir?: string): string {
  return resolveRepoRoot(rootDir);
}

export function resolveAuditRegistryRoot(rootDir?: string): string {
  return join(resolveRepoRoot(rootDir), REGISTRY_TIER_AUDIT_DIR);
}

export function resolveSystemRegistryRoot(rootDir?: string): string {
  return join(resolveRepoRoot(rootDir), REGISTRY_TIER_SYSTEM_DIR);
}

export function resolveLegacyAuditValidationRegistryRoot(rootDir?: string): string {
  return join(resolveRepoRoot(rootDir), LEGACY_AUDIT_VALIDATION_DIR);
}

export function resolveRegistryRootForProjectKind(
  projectKind: ProjectKind,
  rootDir?: string,
): string {
  if (projectKind === PROJECT_KIND_AUDIT) return resolveAuditRegistryRoot(rootDir);
  if (projectKind === PROJECT_KIND_SYSTEM_TEST) return resolveSystemRegistryRoot(rootDir);
  return resolveUserRegistryRoot(rootDir);
}

export function resolveRegistryRootForClass(
  registryClass: RegistryClass,
  rootDir?: string,
): string {
  return resolveRegistryRootForProjectKind(registryClassToProjectKind(registryClass), rootDir);
}

export function resolveArtifactRootForProjectKind(
  projectKind: ProjectKind,
  rootDir?: string,
): string {
  return resolveRegistryRootForProjectKind(projectKind, rootDir);
}

export function isUserRegistryRoot(registryRoot: string, repoRoot?: string): boolean {
  return registryRoot.replace(/\\/g, '/') === resolveUserRegistryRoot(repoRoot).replace(/\\/g, '/');
}

export function isFlatTierRegistryRoot(rootDir: string): boolean {
  const normalized = rootDir.replace(/\\/g, '/');
  return FLAT_TIER_DIRS.some(
    (dir) => normalized === dir || normalized.endsWith(`/${dir}`),
  );
}

export function getTierRegistryFilePath(registryRoot: string): string {
  if (isFlatTierRegistryRoot(registryRoot)) {
    return join(registryRoot, REGISTRY_FILE);
  }
  return join(registryRoot, USER_REGISTRY_DIR, REGISTRY_FILE);
}

export function getNestedTierRegistryFilePath(registryRoot: string): string {
  return join(registryRoot, USER_REGISTRY_DIR, REGISTRY_FILE);
}

export function getUserRegistryFilePath(rootDir?: string): string {
  return join(resolveUserRegistryRoot(rootDir), USER_REGISTRY_DIR, REGISTRY_FILE);
}

export function getAuditRegistryFilePath(rootDir?: string): string {
  return join(resolveAuditRegistryRoot(rootDir), REGISTRY_FILE);
}

export function getSystemRegistryFilePath(rootDir?: string): string {
  return join(resolveSystemRegistryRoot(rootDir), REGISTRY_FILE);
}

export function getLegacyAuditValidationRegistryFilePath(rootDir?: string): string {
  return join(resolveLegacyAuditValidationRegistryRoot(rootDir), REGISTRY_FILE);
}
