/**
 * Project Lifecycle Management V1 — public API.
 */

export {
  PROJECT_LIFECYCLE_MANAGEMENT_V1_PASS_TOKEN,
  PROJECT_LIFECYCLE_DELETE_ROUTE_V1_PASS_TOKEN,
  PROJECT_DELETED_SUCCESSFULLY,
  type ProjectArtifactType,
  type ProjectArtifactLifecycleState,
  type ProjectOwnershipArtifact,
  type ProjectOwnershipIndexFile,
  type ProjectArtifactDiscoveryResult,
  type ProjectDeleteAuditStep,
  type ProjectDeleteResult,
  type ProjectDuplicateResult,
  type ProjectRestoreResult,
  type ProjectOrphanRecord,
  type ProjectOwnershipAuditResult,
  type OrphanRemediationAction,
} from './project-lifecycle-types.js';

export {
  readProjectOwnershipIndex,
  writeProjectOwnershipIndex,
  registerProjectOwnershipArtifact,
  listOwnershipArtifactsForProject,
  removeOwnershipArtifactsForProject,
  getProjectOwnershipIndexPath,
  resetProjectOwnershipIndexForTests,
} from './project-ownership-index.js';

export {
  discoverProjectArtifacts,
  isPathSafeToDelete,
  listRegisteredProjectIds,
} from './project-artifact-discovery.js';

export { auditProjectOwnership, deleteOrphanPath } from './project-ownership-auditor.js';

export { teardownProjectRuntime, type ProjectRuntimeTeardownResult } from './project-runtime-teardown.js';

export {
  deleteProjectLifecycle,
  duplicateProjectLifecycle,
  restoreProjectLifecycle,
} from './project-lifecycle-authority.js';
