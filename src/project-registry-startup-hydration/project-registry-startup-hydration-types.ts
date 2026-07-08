/**
 * Project Registry Startup Hydration — explicit server-side hydration phases.
 */

export type ProjectRegistryHydrationPhase =
  | 'LOADING'
  | 'RESTORING'
  | 'READY'
  | 'EMPTY'
  | 'ERROR';

export const PROJECT_REGISTRY_HYDRATION_TARGET_MS = 2000;

export const PROJECT_REGISTRY_STARTUP_HYDRATION_PASS_TOKEN =
  'PROJECT_REGISTRY_STARTUP_HYDRATION_V1_PASS' as const;

export interface PersistentProjectHydrationRecord {
  readOnly: true;
  projectId: string;
  projectName: string;
  originalPrompt: string | null;
  promptHash: string | null;
  hasSource: boolean;
  hasFileIndex: boolean;
  hasBuildHistoryLinks: boolean;
  hasFeatureContract: boolean;
  status: string | null;
}

export interface ProjectRegistryHydrationSnapshot {
  readOnly: true;
  phase: ProjectRegistryHydrationPhase;
  startedAt: string;
  completedAt: string | null;
  durationMs: number;
  registryProjectCount: number;
  activeProjectCount: number;
  persistentProjectCount: number;
  hydratedProjectIds: readonly string[];
  persistentProjects: readonly PersistentProjectHydrationRecord[];
  error: string | null;
  targetMs: number;
  withinTarget: boolean;
}
