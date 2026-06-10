/**
 * Multi Project Foundation — project state transitions.
 */

import type { MultiProjectRecord, MultiProjectState } from './multi-project-types.js';

const ALLOWED_TRANSITIONS: Record<MultiProjectState, MultiProjectState[]> = {
  CREATED: ['PLANNING', 'FAILED', 'PAUSED', 'ARCHIVED'],
  PLANNING: ['BUILDING', 'FAILED', 'PAUSED', 'ARCHIVED'],
  BUILDING: ['TESTING', 'FAILED', 'PAUSED', 'ARCHIVED'],
  TESTING: ['FIXING', 'FAILED', 'PAUSED', 'ARCHIVED'],
  FIXING: ['VERIFYING', 'FAILED', 'PAUSED', 'ARCHIVED'],
  VERIFYING: ['COMPLETED', 'FAILED', 'PAUSED', 'ARCHIVED'],
  COMPLETED: ['ARCHIVED', 'PAUSED'],
  PAUSED: ['PLANNING', 'BUILDING', 'TESTING', 'FIXING', 'VERIFYING', 'FAILED', 'ARCHIVED'],
  FAILED: ['PLANNING', 'ARCHIVED', 'PAUSED'],
  ARCHIVED: [],
};

export function canTransitionProjectState(from: MultiProjectState, to: MultiProjectState): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function updateProjectState(
  record: MultiProjectRecord,
  newState: MultiProjectState,
): { ok: true; record: MultiProjectRecord } | { ok: false; error: string } {
  if (!canTransitionProjectState(record.state, newState)) {
    return {
      ok: false,
      error: `Invalid transition from ${record.state} to ${newState}`,
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

export function listAllowedTransitions(state: MultiProjectState): MultiProjectState[] {
  return [...(ALLOWED_TRANSITIONS[state] ?? [])];
}
