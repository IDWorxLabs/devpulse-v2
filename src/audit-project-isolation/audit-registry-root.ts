/**
 * Audit Project Isolation V1 — isolated registry roots for validation and audit builds.
 */

import {
  isProjectRegistryTestRoot,
  resolveProjectRegistryRootDir,
} from '../project-registry-v1/project-registry-v1-store.js';
import {
  PROJECT_KIND_AUDIT,
  PROJECT_KIND_SYSTEM_TEST,
  PROJECT_KIND_USER,
  type ProjectKind,
} from '../project-registry-v1/project-kind.js';
import {
  getAuditRegistryFilePath,
  resolveAuditRegistryRoot,
  resolveSystemRegistryRoot,
  resolveUserRegistryRoot,
} from '../registry-sovereignty/registry-tier-paths.js';
import {
  LEGACY_AUDIT_VALIDATION_DIR,
  REGISTRY_TIER_AUDIT_DIR,
} from '../registry-sovereignty/registry-sovereignty-types.js';

/** @deprecated Use REGISTRY_TIER_AUDIT_DIR — kept for legacy path migration. */
export const AUDIT_VALIDATION_REGISTRY_DIR = LEGACY_AUDIT_VALIDATION_DIR;

export { REGISTRY_TIER_AUDIT_DIR };

export function isAuditOrValidationBuildContext(projectRootDir: string): boolean {
  if (process.env.AIDEVENGINE_AUDIT_BUILD === '1') return true;
  if (process.env.AIDEVENGINE_VALIDATION_RUN === '1') return true;
  return isProjectRegistryTestRoot(projectRootDir);
}

export function resolveAuditValidationRegistryRoot(projectRootDir: string): string {
  return resolveAuditRegistryRoot(projectRootDir);
}

export function resolveRegistryRootForPersistentProject(input: {
  projectRootDir: string;
  explicitProjectKind?: ProjectKind;
}): { registryRoot: string; projectKind: ProjectKind; artifactRoot: string } {
  const repoRoot = resolveProjectRegistryRootDir();
  if (isAuditOrValidationBuildContext(input.projectRootDir)) {
    const projectKind =
      input.explicitProjectKind ??
      (process.env.AIDEVENGINE_AUDIT_BUILD === '1' ? PROJECT_KIND_AUDIT : PROJECT_KIND_SYSTEM_TEST);
    const registryRoot =
      projectKind === PROJECT_KIND_AUDIT
        ? resolveAuditRegistryRoot(repoRoot)
        : resolveSystemRegistryRoot(repoRoot);
    return {
      registryRoot,
      projectKind,
      artifactRoot:
        projectKind === PROJECT_KIND_AUDIT
          ? resolveAuditRegistryRoot(repoRoot)
          : resolveSystemRegistryRoot(repoRoot),
    };
  }
  return {
    registryRoot: resolveUserRegistryRoot(repoRoot),
    projectKind: input.explicitProjectKind ?? PROJECT_KIND_USER,
    artifactRoot: repoRoot,
  };
}

export function getIsolatedAuditRegistryFilePath(projectRootDir?: string): string {
  return getAuditRegistryFilePath(projectRootDir);
}
