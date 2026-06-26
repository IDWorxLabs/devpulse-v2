/**
 * Workspace Navigation V1 — validation helpers.
 */

import type { WorkspaceNavigationState } from './workspace-navigation-types.js';
import { pushWorkspaceNavigationEntry } from './workspace-navigation-history.js';

export function workspaceNavigationWouldRenderBlankProjectFiles(containerHtml: string): boolean {
  const trimmed = containerHtml.trim();
  if (!trimmed) return true;
  if (/pwe-shell|pwe-state-panel|pwe-loading-panel/.test(trimmed)) return false;
  return trimmed.length < 24;
}

export function validateWorkspaceNavigationSequence(state: WorkspaceNavigationState): boolean {
  if (state.index < -1 || state.index >= state.entries.length) return false;
  return true;
}

export function simulateProjectsToFilesNavigation(): WorkspaceNavigationState {
  let state: WorkspaceNavigationState = { readOnly: true, entries: [], index: -1 };
  state = pushWorkspaceNavigationEntry(state, {
    surfaceId: 'projects',
    projectId: null,
    label: 'Projects',
    timestamp: Date.now(),
  });
  state = pushWorkspaceNavigationEntry(state, {
    surfaceId: 'project-files',
    projectId: 'lisa-1',
    label: 'Project Files',
    timestamp: Date.now() + 1,
    params: { selectedFile: 'source/package.json' },
  });
  return state;
}
