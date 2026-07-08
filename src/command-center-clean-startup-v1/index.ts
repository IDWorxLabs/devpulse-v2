/**
 * Command Center Clean Startup V1 — public API.
 */

export {
  COMMAND_CENTER_CLEAN_STARTUP_V1_PASS_TOKEN,
  USER_SELECTED_PROJECT_SESSION_KEY,
  RESUME_SESSION_REQUESTED_SESSION_KEY,
  FRESH_LOAD_SESSION_KEY,
  type CleanStartupSessionFlags,
  type ResolveStartupActiveProjectInput,
  type ResumePreviousSessionVisibilityInput,
} from './command-center-clean-startup-types.js';

export {
  resolveStartupActiveProjectId,
  shouldAutoHydrateProjectChat,
  shouldUseCachedRegistryFallback,
  shouldShowResumePreviousSession,
  hasPersistedSessionStorageHints,
} from './command-center-clean-startup-authority.js';
