/**
 * Command Center Stale Project Purge V1 — types and trace tokens.
 */

export const COMMAND_CENTER_STALE_PROJECT_PURGE_V1_PASS_TOKEN =
  'COMMAND_CENTER_STALE_PROJECT_PURGE_V1_PASS' as const;

export const COMMAND_CENTER_STALE_PROJECT_PURGE_TRACE = 'COMMAND_CENTER_STALE_PROJECT_PURGED' as const;

export const ACTIVE_PROJECT_LOCAL_STORAGE_KEYS = [
  'aidevengine.project-registry-cache.v1',
  'aidevengine.project-workspace-explorer-state.v1',
] as const;

export const ACTIVE_PROJECT_SESSION_STORAGE_KEYS = [
  'aidevengine.active-project-id.v1',
  'aidevengine.active-project-name.v1',
  'aidevengine.active-project-status.v1',
] as const;

export interface CommandCenterProjectChip {
  projectId: string;
  projectName: string;
  active?: boolean;
  buildStatus?: string;
  workspacePath?: string | null;
  previewUrl?: string | null;
  buildProfile?: string | null;
}

export interface CommandCenterClientProjectState {
  activeProjectId: string | null;
  activeProjectName: string | null;
  activeProjectStatus: string | null;
  multiProjectWorkspaces: CommandCenterProjectChip[];
  projectChatThreads: Record<string, string>;
}

export interface StaleProjectPurgePlan {
  readOnly: true;
  shouldPurge: boolean;
  reason: string;
  registryProjectIds: readonly string[];
  staleChipProjectIds: readonly string[];
  activeProjectNotInRegistry: boolean;
  registryEmpty: boolean;
  storageKeysToClear: readonly string[];
}

export interface StaleProjectPurgeResult {
  readOnly: true;
  purged: boolean;
  trace: typeof COMMAND_CENTER_STALE_PROJECT_PURGE_TRACE;
  reason: string;
  clearedChipCount: number;
  clearedActiveProjectId: string | null;
  clearedStorageKeys: readonly string[];
}
