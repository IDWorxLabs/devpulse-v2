/**
 * Workspace Isolation Expansion — workspace state transitions.
 */

import type { WorkspaceRecord, WorkspaceState } from './workspace-isolation-types.js';

const ALLOWED_TRANSITIONS: Record<WorkspaceState, WorkspaceState[]> = {
  ACTIVE: ['PAUSED', 'LOCKED', 'ARCHIVED'],
  PAUSED: ['ACTIVE', 'ARCHIVED'],
  LOCKED: ['ACTIVE', 'ARCHIVED'],
  ARCHIVED: [],
};

export function canTransitionWorkspaceState(from: WorkspaceState, to: WorkspaceState): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function updateWorkspaceState(
  record: WorkspaceRecord,
  newState: WorkspaceState,
): { ok: true; record: WorkspaceRecord } | { ok: false; error: string } {
  if (!canTransitionWorkspaceState(record.state, newState)) {
    return {
      ok: false,
      error: `Invalid workspace transition from ${record.state} to ${newState}`,
    };
  }

  return {
    ok: true,
    record: {
      ...record,
      state: newState,
      updatedAt: Date.now(),
    },
  };
}
