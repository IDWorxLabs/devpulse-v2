/**
 * Cloud Runtime Foundation — state manager (state only, no execution).
 */

import {
  getStoredRuntime,
  appendStateHistory,
  storeRuntime,
  getStoredStateHistory,
} from './cloud-runtime-store.js';
import type { CloudRuntimeState, CloudRuntimeStateHistoryEntry } from './cloud-runtime-types.js';
import { isValidCloudRuntimeStateTransition } from './cloud-runtime-types.js';

export function setRuntimeState(
  runtimeId: string,
  newState: CloudRuntimeState,
  force = false,
): { ok: boolean; previousState: CloudRuntimeState | null; error?: string } {
  const runtime = getStoredRuntime(runtimeId);
  if (!runtime) {
    return { ok: false, previousState: null, error: `Runtime not found: ${runtimeId}` };
  }

  const previousState = runtime.runtimeState;
  if (!force && !isValidCloudRuntimeStateTransition(previousState, newState)) {
    return {
      ok: false,
      previousState,
      error: `Invalid state transition: ${previousState} → ${newState}`,
    };
  }

  const updated = {
    ...runtime,
    runtimeState: newState,
    runtimeStatus: resolveStatusForState(newState),
    updatedAt: Date.now(),
  };
  storeRuntime(updated);

  const historyEntry: CloudRuntimeStateHistoryEntry = {
    runtimeId,
    previousState,
    newState,
    timestamp: Date.now(),
  };
  appendStateHistory(historyEntry);

  return { ok: true, previousState };
}

export function getRuntimeState(runtimeId: string): CloudRuntimeState | null {
  return getStoredRuntime(runtimeId)?.runtimeState ?? null;
}

export function trackRuntimeStateHistory(runtimeId: string): CloudRuntimeStateHistoryEntry[] {
  return getStoredStateHistory(runtimeId);
}

function resolveStatusForState(state: CloudRuntimeState): 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'UNKNOWN' {
  switch (state) {
    case 'READY':
    case 'ACTIVE':
    case 'COMPLETED':
    case 'RESUMABLE':
      return 'HEALTHY';
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
