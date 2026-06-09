/**
 * Cloud Recovery Foundation — state manager.
 */

import {
  getStoredCloudRecovery,
  appendCloudRecoveryStateHistory,
  storeCloudRecovery,
  getStoredCloudRecoveryStateHistory,
} from './cloud-recovery-store.js';
import type { CloudRecoveryState, CloudRecoveryStateHistoryEntry } from './cloud-recovery-types.js';
import { isValidCloudRecoveryStateTransition } from './cloud-recovery-types.js';

export function setRecoveryState(
  recoveryId: string,
  newState: CloudRecoveryState,
  force = false,
): { ok: boolean; previousState: CloudRecoveryState | null; error?: string } {
  const recovery = getStoredCloudRecovery(recoveryId);
  if (!recovery) {
    return { ok: false, previousState: null, error: `Recovery not found: ${recoveryId}` };
  }

  const previousState = recovery.recoveryState;
  if (!force && !isValidCloudRecoveryStateTransition(previousState, newState)) {
    return {
      ok: false,
      previousState,
      error: `Invalid state transition: ${previousState} → ${newState}`,
    };
  }

  storeCloudRecovery({
    ...recovery,
    recoveryState: newState,
    recoveryStatus: resolveStatusForState(newState),
    updatedAt: Date.now(),
  });

  appendCloudRecoveryStateHistory({
    recoveryId,
    previousState,
    newState,
    timestamp: Date.now(),
  });

  return { ok: true, previousState };
}

export function getRecoveryState(recoveryId: string): CloudRecoveryState | null {
  return getStoredCloudRecovery(recoveryId)?.recoveryState ?? null;
}

export function trackRecoveryStateHistory(recoveryId: string): CloudRecoveryStateHistoryEntry[] {
  return getStoredCloudRecoveryStateHistory(recoveryId);
}

function resolveStatusForState(
  state: CloudRecoveryState,
): 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN' {
  if (state === 'COMPLETED' || state === 'RECOVERY_READY') return 'HEALTHY';
  if (state === 'FAILED') return 'BLOCKED';
  if (state.startsWith('WAITING_')) return 'WAITING';
  if (
    state === 'FAILURE_IDENTIFIED' ||
    state === 'RECOVERY_CANDIDATE_IDENTIFIED' ||
    state === 'RECOVERY_PLAN_REGISTERED'
  ) {
    return 'DEGRADED';
  }
  if (state === 'READY') return 'HEALTHY';
  return 'UNKNOWN';
}
