/**
 * Project State Sync V1 — public API.
 */

export {
  PROJECT_STATE_AEE_RECOVERY_REAL_PATH_V1_PASS_TOKEN,
  type ProjectRegistryProjectRecord,
  type ProjectStateSnapshot,
  type ProjectWorkspaceChip,
  type RegistryPayloadLike,
} from './project-state-sync-types.js';

export {
  applyRegistryPayloadToProjectState,
  buildWorkspaceChipsFromRegistry,
  listRegistryProjects,
  pruneWorkspaceChips,
  resolveRegistryActiveProjectId,
  shouldClearActiveProjectAfterDelete,
} from './project-state-sync-authority.js';
