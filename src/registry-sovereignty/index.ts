/**
 * Registry Sovereignty V1 — backward-compatible re-exports.
 */

export {
  REGISTRY_SOVEREIGNTY_V1_PASS_TOKEN,
  LEGACY_AUDIT_VALIDATION_DIR,
  REGISTRY_TIER_AUDIT_DIR,
  REGISTRY_TIER_SYSTEM_DIR,
  type RegistrySovereigntyCleanupResult,
  type RegistrySovereigntyMigrationRecord,
  type RegistrySovereigntyMigrationResult,
  type RegistryTierCounts,
} from '../project-registry-sovereignty/types.js';

export {
  getAuditRegistryFilePath,
  getLegacyAuditValidationRegistryFilePath,
  getSystemRegistryFilePath,
  getTierRegistryFilePath,
  getUserRegistryFilePath,
  isUserRegistryRoot,
  resolveArtifactRootForProjectKind,
  resolveAuditRegistryRoot,
  resolveLegacyAuditValidationRegistryRoot,
  resolveRegistryRootForProjectKind,
  resolveRepoRoot,
  resolveSystemRegistryRoot,
  resolveUserRegistryRoot,
} from '../project-registry-sovereignty/registry-tier-paths.js';

export {
  assertUserRegistryContainsOnlyUserProjects,
  countRegistryTierProjects,
  listUserFacingActiveProjectIds,
  migratePollutedUserRegistry,
  rebuildUserWorkspaceCache,
} from '../project-registry-sovereignty/index.js';

export { enforceUserRegistrySovereigntyOnWrite } from '../project-registry-sovereignty/registry-sovereignty-engine.js';

export { runRegistrySovereigntyStartupRepair } from '../project-registry-sovereignty/registry-sovereignty-engine.js';

export { executeRegistrySovereigntyCleanup } from '../project-registry-sovereignty/registry-sovereignty-engine.js';
