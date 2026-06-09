/**
 * Mobile Push Foundation — state manager.
 */

import {
  getStoredPushRecord,
  appendPushStateHistory,
  storePushRecord,
  getStoredPushStateHistory,
} from './mobile-push-store.js';
import type { PushState, PushStateHistoryEntry } from './mobile-push-types.js';
import { isValidPushStateTransition } from './mobile-push-types.js';

export function setPushState(
  pushId: string,
  newState: PushState,
  force = false,
): { ok: boolean; previousState: PushState | null; error?: string } {
  const record = getStoredPushRecord(pushId);
  if (!record) {
    return { ok: false, previousState: null, error: `Push record not found: ${pushId}` };
  }

  const previousState = record.pushState;
  if (!force && !isValidPushStateTransition(previousState, newState)) {
    return { ok: false, previousState, error: `Invalid state transition: ${previousState} → ${newState}` };
  }

  storePushRecord({
    ...record,
    pushState: newState,
    pushStatus: resolveStatusForState(newState),
    updatedAt: Date.now(),
  });

  appendPushStateHistory({
    pushId,
    previousState,
    newState,
    timestamp: Date.now(),
  });

  return { ok: true, previousState };
}

export function getPushState(pushId: string): PushState | null {
  return getStoredPushRecord(pushId)?.pushState ?? null;
}

export function trackPushStateHistory(pushId: string): PushStateHistoryEntry[] {
  return getStoredPushStateHistory(pushId);
}

function resolveStatusForState(state: PushState): 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN' {
  if (state === 'READY' || state === 'COMPLETED' || state === 'TARGET_SELECTED') return 'HEALTHY';
  if (state === 'FAILED' || state === 'BLOCKED') return 'BLOCKED';
  if (
    state === 'CREATED' ||
    state === 'PLANNED' ||
    state === 'ELIGIBILITY_CHECKED' ||
    state === 'TOKEN_METADATA_CHECKED' ||
    state === 'PAYLOAD_PLANNED' ||
    state === 'ROUTED'
  ) {
    return 'WAITING';
  }
  if (state === 'DEFERRED' || state === 'ARCHIVED') return 'DEGRADED';
  return 'UNKNOWN';
}
