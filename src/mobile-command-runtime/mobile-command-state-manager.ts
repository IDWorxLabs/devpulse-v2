/**
 * Mobile Command Runtime Foundation — state manager.
 */

import {
  getStoredMobileCommandSession,
  appendMobileCommandStateHistory,
  storeMobileCommandSession,
  getStoredMobileCommandStateHistory,
} from './mobile-command-store.js';
import type { MobileCommandState, MobileCommandStateHistoryEntry } from './mobile-command-types.js';
import { isValidMobileCommandStateTransition } from './mobile-command-types.js';

export function setMobileCommandState(
  mobileCommandId: string,
  newState: MobileCommandState,
  force = false,
): { ok: boolean; previousState: MobileCommandState | null; error?: string } {
  const session = getStoredMobileCommandSession(mobileCommandId);
  if (!session) {
    return { ok: false, previousState: null, error: `Mobile command not found: ${mobileCommandId}` };
  }

  const previousState = session.mobileCommandState;
  if (!force && !isValidMobileCommandStateTransition(previousState, newState)) {
    return { ok: false, previousState, error: `Invalid state transition: ${previousState} → ${newState}` };
  }

  storeMobileCommandSession({
    ...session,
    mobileCommandState: newState,
    mobileCommandStatus: resolveStatusForState(newState),
    updatedAt: Date.now(),
  });

  appendMobileCommandStateHistory({
    mobileCommandId,
    previousState,
    newState,
    timestamp: Date.now(),
  });

  return { ok: true, previousState };
}

export function getMobileCommandState(mobileCommandId: string): MobileCommandState | null {
  return getStoredMobileCommandSession(mobileCommandId)?.mobileCommandState ?? null;
}

export function trackMobileCommandStateHistory(mobileCommandId: string): MobileCommandStateHistoryEntry[] {
  return getStoredMobileCommandStateHistory(mobileCommandId);
}

function resolveStatusForState(
  state: MobileCommandState,
): 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN' {
  if (state === 'COMPLETED' || state === 'ACTION_ALLOWED' || state.startsWith('CONNECTED_')) return 'HEALTHY';
  if (state === 'FAILED' || state === 'ACTION_BLOCKED') return 'BLOCKED';
  if (state === 'WAITING_FOR_APPROVAL') return 'WAITING';
  if (state === 'READY') return 'HEALTHY';
  return 'UNKNOWN';
}
