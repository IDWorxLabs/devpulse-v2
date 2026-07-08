/**
 * Registry Sovereignty V1 — backward-compatible tier path re-exports.
 */

export {
  getAuditRegistryFilePath,
  getLegacyAuditValidationRegistryFilePath,
  getNestedTierRegistryFilePath,
  getSystemRegistryFilePath,
  getTierRegistryFilePath,
  getUserRegistryFilePath,
  isFlatTierRegistryRoot,
  isUserRegistryRoot,
  resolveArtifactRootForProjectKind,
  resolveAuditRegistryRoot,
  resolveLegacyAuditValidationRegistryRoot,
  resolveRegistryRootForClass,
  resolveRegistryRootForProjectKind,
  resolveRepoRoot,
  resolveSystemRegistryRoot,
  resolveUserRegistryRoot,
} from '../project-registry-sovereignty/registry-tier-paths.js';
