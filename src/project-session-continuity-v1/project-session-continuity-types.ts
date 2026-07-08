/**
 * Project Session Continuity V1 — durable project + conversation session types.
 */

export const PROJECT_SESSION_CONTINUITY_V1_PASS_TOKEN =
  'PROJECT_SESSION_CONTINUITY_V1_PASS' as const;

export const PROJECT_SESSION_STORE_VERSION = 1 as const;
export const PROJECT_SESSION_STORE_DIR = '.aidevengine/project-sessions' as const;
export const PROJECT_SESSION_ACTIVE_POINTER_FILE = 'active-session-pointer.json' as const;

export type ProjectSessionChatRole = 'user' | 'brain' | 'system';

export interface ProjectSessionChatMessage {
  id: string;
  role: ProjectSessionChatRole;
  text: string;
  html: string | null;
  timestamp: number;
}

export interface ProjectSessionAeeAelEvent {
  type: string;
  detail: string;
  timestamp: number;
}

export interface ProjectSessionRecord {
  version: typeof PROJECT_SESSION_STORE_VERSION;
  sessionId: string;
  projectId: string;
  projectName: string;
  projectKind: 'USER';
  createdAt: string;
  updatedAt: string;
  status: 'ACTIVE' | 'ARCHIVED';
  currentPrompt: string | null;
  activeBuildRunId: string | null;
  previewUrl: string | null;
  previewBindingReason: string | null;
  previewRepairAction: string | null;
  executionTraceLink: string | null;
  buildStatus: string | null;
  workspacePath: string | null;
  buildProfile: string | null;
  chatMessages: ProjectSessionChatMessage[];
  chatHistoryHtml: string | null;
  aeeAelEvents: ProjectSessionAeeAelEvent[];
}

export interface ProjectSessionActivePointer {
  activeProjectId: string;
  activeSessionId: string;
  updatedAt: string;
}

export interface ProjectSessionContext {
  readOnly: true;
  projectId: string;
  sessionId: string;
  projectName: string;
  projectKind: 'USER';
  currentPrompt: string | null;
  activeBuildRunId: string | null;
  previewUrl: string | null;
  previewBindingReason: string | null;
  previewRepairAction: string | null;
  executionTraceLink: string | null;
  buildStatus: string | null;
  workspacePath: string | null;
  buildProfile: string | null;
  chatMessages: ProjectSessionChatMessage[];
  chatHistoryHtml: string | null;
  aeeAelEvents: ProjectSessionAeeAelEvent[];
}

export interface EnsureBuildProjectSessionInput {
  rawPrompt: string;
  activeProjectId?: string | null;
  projectName?: string | null;
  confirmFreshCopy?: boolean;
  confirmResume?: boolean;
  resumeProjectId?: string | null;
  rejectDuplicates?: boolean;
  rootDir?: string;
  repoRootDir?: string;
}

export interface EnsureBuildProjectSessionResult {
  readOnly: true;
  projectId: string;
  sessionId: string;
  projectName: string;
  createdProject: boolean;
  createdSession: boolean;
  effectivePrompt: string;
  duplicateResumeBlocked: boolean;
  duplicateResumePayload: Record<string, unknown> | null;
}

export interface LivePreviewSessionBinding {
  readOnly: true;
  projectId: string;
  sessionId: string;
  buildRunId: string | null;
  previewUrl: string | null;
  previewReady: boolean;
  bindingReason: string;
  repairAction: string | null;
  iframeRenderable: boolean;
}
