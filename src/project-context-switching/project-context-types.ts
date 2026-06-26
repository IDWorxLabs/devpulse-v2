/**
 * Project Tab Context Switch — resolved workspace context types.
 */

export const PROJECT_TAB_CONTEXT_SWITCH_PASS_TOKEN =
  'PROJECT_TAB_CONTEXT_SWITCH_V1_PASS' as const;

export type ProjectContextLoadStatus =
  | 'LOADED'
  | 'PARTIAL'
  | 'NOT_FOUND'
  | 'ERROR';

export interface ProjectChatContextSnapshot {
  readOnly: true;
  threadId: string;
  hasSavedThread: boolean;
}

export interface ProjectLivePreviewStateSnapshot {
  readOnly: true;
  previewUrl: string | null;
  buildStatus: string;
  buildProfile: string | null;
  workspacePath: string | null;
  connected: boolean;
}

export interface ProjectExecutionTraceStateSnapshot {
  readOnly: true;
  activeBuildRunId: string | null;
  lastSuccessfulBuildRunId: string | null;
  projectRealityStatus: string | null;
}

export interface ProjectNotificationSnapshot {
  readOnly: true;
  projectId: string;
  scope: 'PROJECT' | 'GLOBAL';
  count: number;
}

export interface ResolvedProjectContext {
  readOnly: true;
  projectId: string;
  projectName: string;
  displayName: string;
  domain: string;
  selectedProfile: string | null;
  persistentWorkspacePath: string | null;
  sourceRoot: string | null;
  activeBuildRunId: string | null;
  lastPrompt: string | null;
  chatContext: ProjectChatContextSnapshot;
  livePreviewState: ProjectLivePreviewStateSnapshot;
  executionTraceState: ProjectExecutionTraceStateSnapshot;
  notifications: ProjectNotificationSnapshot;
  status: ProjectContextLoadStatus;
  loadedFromRegistry: boolean;
  loadedFromPersistentProject: boolean;
  loadedAt: string;
}

export interface ProjectTabSwitchResult {
  readOnly: true;
  ok: boolean;
  projectContext: ResolvedProjectContext | null;
  executionTraceEvents: ProjectContextTraceEvent[];
  error?: string;
}

export interface ProjectContextTraceEvent {
  readOnly: true;
  eventType: string;
  eventTitle: string;
  technicalDetail: string;
  runtimeStage: string;
  timestamp: string;
  projectId?: string;
}
