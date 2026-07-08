/**
 * Command Center Clean Startup V1 — types.
 */

export const COMMAND_CENTER_CLEAN_STARTUP_V1_PASS_TOKEN =
  'COMMAND_CENTER_CLEAN_STARTUP_V1_PASS' as const;

export const USER_SELECTED_PROJECT_SESSION_KEY =
  'aidevengine.user-selected-project.v1' as const;

export const RESUME_SESSION_REQUESTED_SESSION_KEY =
  'aidevengine.resume-session-requested.v1' as const;

export const FRESH_LOAD_SESSION_KEY = 'aidevengine.fresh-load-session.v1' as const;

export interface CleanStartupSessionFlags {
  userExplicitlySelectedProjectId: string | null;
  resumeSessionRequested: boolean;
  freshLoadSession: boolean;
}

export interface ResolveStartupActiveProjectInput {
  registryActiveProjectId: string | null;
  registryProjectIds: readonly string[];
  userExplicitlySelectedProjectId: string | null;
  resumeSessionRequested: boolean;
}

export interface ResumePreviousSessionVisibilityInput {
  registryProjectIds: readonly string[];
  hasPersistedSessionHints: boolean;
  resumeSessionRequested: boolean;
  activeProjectId: string | null;
}
