/**
 * Project Workspace Explorer V1 — per-project explorer UI state (client persistence helpers).
 */

import type { ProjectWorkspaceExplorerState } from './project-workspace-types.js';

export const PROJECT_WORKSPACE_EXPLORER_STATE_KEY = 'aidevengine.project-workspace-explorer-state.v1';

export function createDefaultExplorerState(projectId: string): ProjectWorkspaceExplorerState {
  return {
    readOnly: true,
    projectId,
    expandedFolders: [],
    scrollPosition: 0,
    openedFiles: [],
    selectedFile: null,
    searchQuery: '',
  };
}

export function mergeExplorerState(
  existing: ProjectWorkspaceExplorerState | null,
  projectId: string,
  patch: Partial<Omit<ProjectWorkspaceExplorerState, 'readOnly' | 'projectId'>>,
): ProjectWorkspaceExplorerState {
  const base = existing?.projectId === projectId ? existing : createDefaultExplorerState(projectId);
  return {
    readOnly: true,
    projectId,
    expandedFolders: patch.expandedFolders ?? base.expandedFolders,
    scrollPosition: patch.scrollPosition ?? base.scrollPosition,
    openedFiles: patch.openedFiles ?? base.openedFiles,
    selectedFile: patch.selectedFile !== undefined ? patch.selectedFile : base.selectedFile,
    searchQuery: patch.searchQuery ?? base.searchQuery,
  };
}

export function parseExplorerStateStore(raw: string | null): Record<string, ProjectWorkspaceExplorerState> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, ProjectWorkspaceExplorerState>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function serializeExplorerStateStore(store: Record<string, ProjectWorkspaceExplorerState>): string {
  return JSON.stringify(store);
}
