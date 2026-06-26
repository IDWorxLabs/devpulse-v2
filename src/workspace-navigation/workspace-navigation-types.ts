/**
 * Workspace Navigation V1 — types.
 */

export const WORKSPACE_NAVIGATION_PASS_TOKEN = 'WORKSPACE_NAVIGATION_V1_PASS' as const;

export interface WorkspaceNavigationEntry {
  readOnly: true;
  surfaceId: string;
  projectId: string | null;
  label: string;
  timestamp: number;
  params?: Record<string, unknown>;
}

export interface WorkspaceNavigationState {
  readOnly: true;
  entries: WorkspaceNavigationEntry[];
  index: number;
}

export interface WorkspaceNavigationSnapshot {
  readOnly: true;
  canGoBack: boolean;
  canGoForward: boolean;
  current: WorkspaceNavigationEntry | null;
  breadcrumb: string;
}
