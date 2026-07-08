/**
 * Registry Sovereignty V1 — constitutional project registry authority.
 */

export {
  REGISTRY_SOVEREIGNTY_V1_PASS_TOKEN,
  LEGACY_AUDIT_VALIDATION_DIR,
  REGISTRY_TIER_AUDIT_DIR,
  REGISTRY_TIER_SYSTEM_DIR,
  type RegistryClass,
  type RegistryDuplicateRepairRecord,
  type RegistryIntegrityIssue,
  type RegistrySovereigntyCleanupInput,
  type RegistrySovereigntyCleanupResult,
  type RegistrySovereigntyMigrationRecord,
  type RegistrySovereigntyMigrationResult,
  type RegistrySovereigntyReport,
  type RegistrySovereigntyTrigger,
  type RegistryTierCounts,
} from './types.js';

export {
  classifyRegistryProject,
  inferRegistryClassFromProjectId,
  isUserRegistryClass,
  normalizeProjectRegistryName,
  projectKindToRegistryClass,
  registryClassToProjectKind,
} from './registry-classifier.js';

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
} from './registry-tier-paths.js';

export { repairUserActiveProjectId } from './registry-active-project-authority.js';

export {
  listUserFacingActiveProjectIds,
  rebuildUserWorkspaceCache,
} from './registry-cache-authority.js';

export { scanRegistryIntegrity } from './registry-integrity-checker.js';

export {
  migrateNestedTierRegistryFiles,
  migratePollutedUserRegistry,
} from './registry-migration-engine.js';

export { repairDuplicateNormalizedNames } from './registry-repair-engine.js';

export {
  assertAuditRegistryContainsOnlyAuditProjects,
  assertRegistrySovereignty,
  assertSystemRegistryContainsOnlySystemProjects,
  assertUserRegistryContainsOnlyUserProjects,
  countRegistryTierProjects,
} from './registry-validator.js';

export {
  buildRegistrySovereigntyReport,
  formatRegistrySovereigntyReport,
} from './registry-report-builder.js';

export {
  enforceUserRegistrySovereigntyOnWrite,
  executeRegistrySovereigntyCleanup,
  runRegistrySovereigntyEngine,
  runRegistrySovereigntyOnMutation,
  runRegistrySovereigntyStartupRepair,
} from './registry-sovereignty-engine.js';
