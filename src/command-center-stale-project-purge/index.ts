/**
 * Command Center Stale Project Purge V1 — public API.
 */

export {
  ACTIVE_PROJECT_LOCAL_STORAGE_KEYS,
  ACTIVE_PROJECT_SESSION_STORAGE_KEYS,
  COMMAND_CENTER_STALE_PROJECT_PURGE_TRACE,
  COMMAND_CENTER_STALE_PROJECT_PURGE_V1_PASS_TOKEN,
  type CommandCenterClientProjectState,
  type CommandCenterProjectChip,
  type StaleProjectPurgePlan,
  type StaleProjectPurgeResult,
} from './command-center-stale-project-purge-types.js';

export {
  applyStaleCommandCenterProjectPurge,
  buildWorkspaceChipsFromRegistryProjects,
  listRegistryProjectIds,
  planStaleCommandCenterProjectPurge,
  pruneProjectChipsAgainstRegistry,
  resolveActiveProjectIdForRegistry,
} from './command-center-stale-project-purge-authority.js';
