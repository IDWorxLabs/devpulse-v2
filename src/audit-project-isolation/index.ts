/**
 * Audit Project Isolation V1 — public API.
 */

export {
  AUDIT_PROJECT_ISOLATION_AND_CLEANUP_V1_PASS_TOKEN,
  cleanupTestProjects,
  filterUserFacingRegistryProjects,
  listTestProjectCleanupCandidates,
  type TestProjectCleanupCandidate,
  type TestProjectCleanupResult,
} from './test-project-cleanup.js';

export {
  AUDIT_VALIDATION_REGISTRY_DIR,
  REGISTRY_TIER_AUDIT_DIR,
  getIsolatedAuditRegistryFilePath,
  isAuditOrValidationBuildContext,
  resolveAuditValidationRegistryRoot,
  resolveRegistryRootForPersistentProject,
} from './audit-registry-root.js';
