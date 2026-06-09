/**
 * Workspace Hosting Foundation — state manager (state only, no execution).
 */

import {
  getStoredWorkspace,
  appendWorkspaceStateHistory,
  storeWorkspace,
  getStoredWorkspaceStateHistory,
} from './workspace-hosting-store.js';
import type { WorkspaceState, WorkspaceStateHistoryEntry } from './workspace-hosting-types.js';
import { isValidWorkspaceStateTransition } from './workspace-hosting-types.js';

export function setWorkspaceState(
  workspaceId: string,
  newState: WorkspaceState,
  force = false,
): { ok: boolean; previousState: WorkspaceState | null; error?: string } {
  const workspace = getStoredWorkspace(workspaceId);
  if (!workspace) {
    return { ok: false, previousState: null, error: `Workspace not found: ${workspaceId}` };
  }

  const previousState = workspace.workspaceState;
  if (!force && !isValidWorkspaceStateTransition(previousState, newState)) {
    return {
      ok: false,
      previousState,
      error: `Invalid state transition: ${previousState} → ${newState}`,
    };
  }

  storeWorkspace({
    ...workspace,
    workspaceState: newState,
    workspaceStatus: resolveStatusForState(newState),
    updatedAt: Date.now(),
  });

  appendWorkspaceStateHistory({
    workspaceId,
    previousState,
    newState,
    timestamp: Date.now(),
  });

  return { ok: true, previousState };
}

export function getWorkspaceState(workspaceId: string): WorkspaceState | null {
  return getStoredWorkspace(workspaceId)?.workspaceState ?? null;
}

export function trackWorkspaceStateHistory(workspaceId: string): WorkspaceStateHistoryEntry[] {
  return getStoredWorkspaceStateHistory(workspaceId);
}

function resolveStatusForState(state: WorkspaceState): 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'ISOLATED' | 'UNKNOWN' {
  switch (state) {
    case 'READY':
    case 'ACTIVE':
    case 'COMPLETED':
    case 'RESUMABLE':
      return 'HEALTHY';
    case 'ISOLATED':
      return 'ISOLATED';
    case 'PAUSED':
    case 'INITIALIZING':
      return 'DEGRADED';
    case 'FAILED':
    case 'ARCHIVED':
      return 'BLOCKED';
    default:
      return 'UNKNOWN';
  }
}
