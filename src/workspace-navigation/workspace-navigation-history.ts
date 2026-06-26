/**
 * Workspace Navigation V1 — in-app surface history.
 */

import type {
  WorkspaceNavigationEntry,
  WorkspaceNavigationSnapshot,
  WorkspaceNavigationState,
} from './workspace-navigation-types.js';

function entriesEqual(a: WorkspaceNavigationEntry, b: WorkspaceNavigationEntry): boolean {
  return (
    a.surfaceId === b.surfaceId &&
    a.projectId === b.projectId &&
    JSON.stringify(a.params ?? {}) === JSON.stringify(b.params ?? {})
  );
}

export function createWorkspaceNavigationState(): WorkspaceNavigationState {
  return { readOnly: true, entries: [], index: -1 };
}

export function pushWorkspaceNavigationEntry(
  state: WorkspaceNavigationState,
  entry: Omit<WorkspaceNavigationEntry, 'readOnly'>,
): WorkspaceNavigationState {
  const nextEntry: WorkspaceNavigationEntry = { readOnly: true, ...entry };
  const current = state.entries[state.index] ?? null;
  if (current && entriesEqual(current, nextEntry)) {
    return state;
  }

  const trimmed = state.entries.slice(0, state.index + 1);
  trimmed.push(nextEntry);
  return {
    readOnly: true,
    entries: trimmed,
    index: trimmed.length - 1,
  };
}

export function workspaceNavigationBack(
  state: WorkspaceNavigationState,
): { state: WorkspaceNavigationState; entry: WorkspaceNavigationEntry | null } {
  if (state.index <= 0) {
    return { state, entry: null };
  }
  const nextIndex = state.index - 1;
  return {
    state: { readOnly: true, entries: state.entries, index: nextIndex },
    entry: state.entries[nextIndex] ?? null,
  };
}

export function workspaceNavigationForward(
  state: WorkspaceNavigationState,
): { state: WorkspaceNavigationState; entry: WorkspaceNavigationEntry | null } {
  if (state.index >= state.entries.length - 1) {
    return { state, entry: null };
  }
  const nextIndex = state.index + 1;
  return {
    state: { readOnly: true, entries: state.entries, index: nextIndex },
    entry: state.entries[nextIndex] ?? null,
  };
}

export function snapshotWorkspaceNavigation(
  state: WorkspaceNavigationState,
  surfaceTitles: Record<string, string>,
  projectNameResolver?: (projectId: string | null) => string | null,
): WorkspaceNavigationSnapshot {
  const current = state.entries[state.index] ?? null;
  const surfaceLabel = current ? surfaceTitles[current.surfaceId] ?? current.label : 'AiDevEngine';
  const projectName =
    current?.projectId && projectNameResolver
      ? projectNameResolver(current.projectId)
      : null;
  const breadcrumb = projectName ? `${surfaceLabel} / ${projectName}` : surfaceLabel;

  return {
    readOnly: true,
    canGoBack: state.index > 0,
    canGoForward: state.index < state.entries.length - 1 && state.entries.length > 0,
    current,
    breadcrumb,
  };
}
