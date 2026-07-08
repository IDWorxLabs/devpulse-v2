/**
 * Project Name Conflict Resolution V1 — public API.
 */

export {
  PROJECT_NAME_CONFLICT_RESOLUTION_API_PATH,
  PROJECT_NAME_CONFLICT_RESOLUTION_CONTRACT_VERSION,
  PROJECT_NAME_CONFLICT_RESOLUTION_TRACE,
  PROJECT_NAME_CONFLICT_RESOLUTION_V1_PASS_TOKEN,
  type ProjectIdentityContract,
  type ProjectNameConflictEvidenceRecord,
  type ProjectNameConflictResolutionInput,
  type ProjectNameConflictResolutionMode,
  type ProjectNameConflictResolutionPlan,
} from './project-name-conflict-resolution-types.js';

export {
  deriveVersionedRebuildName,
  findExistingUserProjectByName,
  promptRequestsFreshRebuild,
  resolveProjectNameConflict,
  resolveWorkspacePathForProject,
} from './project-name-conflict-resolver.js';

export {
  ProjectNameConflictRejectedError,
  applyProjectIdentityForBuild,
  recordProjectNameConflictEvidence,
  resolveRequestedProjectName,
} from './project-name-conflict-authority.js';
