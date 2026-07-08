/**
 * Project State Sync V1 — shared registry → UI state contract.
 */

export const PROJECT_STATE_AEE_RECOVERY_REAL_PATH_V1_PASS_TOKEN =
  'PROJECT_STATE_AEE_RECOVERY_REAL_PATH_V1_PASS' as const;

export interface ProjectRegistryProjectRecord {
  projectId: string;
  name: string;
  status?: string;
  workspacePath?: string | null;
  previewUrl?: string | null;
  buildStatus?: string;
  isActive?: boolean;
}

export interface ProjectWorkspaceChip {
  projectId: string;
  projectName: string;
  active: boolean;
  buildStatus: string;
  workspacePath: string | null;
  previewUrl: string | null;
}

export interface ProjectStateSnapshot {
  readOnly: true;
  activeProjectId: string | null;
  projects: readonly ProjectRegistryProjectRecord[];
  multiProjectWorkspaces: readonly ProjectWorkspaceChip[];
  hydrationState: 'pending' | 'loading' | 'ready' | 'empty' | 'error' | 'restoring';
}

export interface RegistryPayloadLike {
  activeProjectId?: string | null;
  projects?: {
    items?: ProjectRegistryProjectRecord[];
    activeProjectId?: string | null;
    count?: number;
    activeCount?: number;
  };
  registry?: { activeProjectId?: string | null; projects?: ProjectRegistryProjectRecord[] };
  multiProjectWorkspaces?: ProjectWorkspaceChip[];
}
