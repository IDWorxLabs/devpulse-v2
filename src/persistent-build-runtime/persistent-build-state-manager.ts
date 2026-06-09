/**
 * Persistent Build Runtime Foundation — state manager.
 */

import {
  getStoredPersistentBuild,
  appendPersistentBuildStateHistory,
  storePersistentBuild,
  getStoredPersistentBuildStateHistory,
} from './persistent-build-store.js';
import type { PersistentBuildState, PersistentBuildStateHistoryEntry } from './persistent-build-types.js';
import { isValidPersistentBuildStateTransition } from './persistent-build-types.js';

export function setPersistentBuildState(
  buildId: string,
  newState: PersistentBuildState,
  force = false,
): { ok: boolean; previousState: PersistentBuildState | null; error?: string } {
  const build = getStoredPersistentBuild(buildId);
  if (!build) {
    return { ok: false, previousState: null, error: `Build not found: ${buildId}` };
  }

  const previousState = build.buildState;
  if (!force && !isValidPersistentBuildStateTransition(previousState, newState)) {
    return {
      ok: false,
      previousState,
      error: `Invalid state transition: ${previousState} → ${newState}`,
    };
  }

  storePersistentBuild({
    ...build,
    buildState: newState,
    buildStatus: resolveStatusForState(newState),
    updatedAt: Date.now(),
  });

  appendPersistentBuildStateHistory({
    buildId,
    previousState,
    newState,
    timestamp: Date.now(),
  });

  return { ok: true, previousState };
}

export function getPersistentBuildState(buildId: string): PersistentBuildState | null {
  return getStoredPersistentBuild(buildId)?.buildState ?? null;
}

export function trackPersistentBuildStateHistory(buildId: string): PersistentBuildStateHistoryEntry[] {
  return getStoredPersistentBuildStateHistory(buildId);
}

function resolveStatusForState(
  state: PersistentBuildState,
): 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN' {
  switch (state) {
    case 'READY':
    case 'ACTIVE':
    case 'COMPLETED':
    case 'RESUMABLE':
      return 'HEALTHY';
    case 'PAUSED':
    case 'INITIALIZING':
      return 'DEGRADED';
    case 'WAITING_FOR_APPROVAL':
    case 'WAITING_FOR_VERIFICATION':
    case 'WAITING_FOR_RECOVERY':
      return 'WAITING';
    case 'FAILED':
    case 'ARCHIVED':
      return 'BLOCKED';
    default:
      return 'UNKNOWN';
  }
}
