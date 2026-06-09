/**
 * Cross Device Runtime Foundation — state manager.
 */

import {
  getStoredCrossDeviceSession,
  appendCrossDeviceStateHistory,
  storeCrossDeviceSession,
  getStoredCrossDeviceStateHistory,
} from './cross-device-store.js';
import type { CrossDeviceState, CrossDeviceStateHistoryEntry } from './cross-device-types.js';
import { isValidCrossDeviceStateTransition } from './cross-device-types.js';

export function setCrossDeviceState(
  crossDeviceId: string,
  newState: CrossDeviceState,
  force = false,
): { ok: boolean; previousState: CrossDeviceState | null; error?: string } {
  const session = getStoredCrossDeviceSession(crossDeviceId);
  if (!session) {
    return { ok: false, previousState: null, error: `Cross device not found: ${crossDeviceId}` };
  }

  const previousState = session.crossDeviceState;
  if (!force && !isValidCrossDeviceStateTransition(previousState, newState)) {
    return { ok: false, previousState, error: `Invalid state transition: ${previousState} → ${newState}` };
  }

  storeCrossDeviceSession({
    ...session,
    crossDeviceState: newState,
    crossDeviceStatus: resolveStatusForState(newState),
    updatedAt: Date.now(),
  });

  appendCrossDeviceStateHistory({
    crossDeviceId,
    previousState,
    newState,
    timestamp: Date.now(),
  });

  return { ok: true, previousState };
}

export function getCrossDeviceState(crossDeviceId: string): CrossDeviceState | null {
  return getStoredCrossDeviceSession(crossDeviceId)?.crossDeviceState ?? null;
}

export function trackCrossDeviceStateHistory(crossDeviceId: string): CrossDeviceStateHistoryEntry[] {
  return getStoredCrossDeviceStateHistory(crossDeviceId);
}

function resolveStatusForState(state: CrossDeviceState): 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN' {
  if (state === 'COMPLETED' || state === 'HANDOFF_COMPLETED' || state === 'VISIBILITY_UPDATED') return 'HEALTHY';
  if (state === 'FAILED') return 'BLOCKED';
  if (state === 'HANDOFF_REQUESTED' || state === 'HANDOFF_AVAILABLE') return 'WAITING';
  if (state === 'READY' || state === 'INITIALIZING' || state === 'DEVICE_REGISTERED') return 'HEALTHY';
  return 'UNKNOWN';
}
