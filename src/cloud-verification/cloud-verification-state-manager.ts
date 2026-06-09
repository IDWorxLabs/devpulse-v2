/**
 * Cloud Verification Foundation — state manager.
 */

import {
  getStoredCloudVerification,
  appendCloudVerificationStateHistory,
  storeCloudVerification,
  getStoredCloudVerificationStateHistory,
} from './cloud-verification-store.js';
import type { CloudVerificationState, CloudVerificationStateHistoryEntry } from './cloud-verification-types.js';
import { isValidCloudVerificationStateTransition } from './cloud-verification-types.js';

export function setCloudVerificationState(
  verificationId: string,
  newState: CloudVerificationState,
  force = false,
): { ok: boolean; previousState: CloudVerificationState | null; error?: string } {
  const verification = getStoredCloudVerification(verificationId);
  if (!verification) {
    return { ok: false, previousState: null, error: `Verification not found: ${verificationId}` };
  }

  const previousState = verification.verificationState;
  if (!force && !isValidCloudVerificationStateTransition(previousState, newState)) {
    return {
      ok: false,
      previousState,
      error: `Invalid state transition: ${previousState} → ${newState}`,
    };
  }

  storeCloudVerification({
    ...verification,
    verificationState: newState,
    verificationStatus: resolveStatusForState(newState),
    updatedAt: Date.now(),
  });

  appendCloudVerificationStateHistory({
    verificationId,
    previousState,
    newState,
    timestamp: Date.now(),
  });

  return { ok: true, previousState };
}

export function getCloudVerificationState(verificationId: string): CloudVerificationState | null {
  return getStoredCloudVerification(verificationId)?.verificationState ?? null;
}

export function trackCloudVerificationStateHistory(
  verificationId: string,
): CloudVerificationStateHistoryEntry[] {
  return getStoredCloudVerificationStateHistory(verificationId);
}

function resolveStatusForState(
  state: CloudVerificationState,
): 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN' {
  if (state === 'COMPLETED') return 'HEALTHY';
  if (state === 'FAILED') return 'BLOCKED';
  if (state.startsWith('WAITING_')) return 'WAITING';
  if (state === 'IN_PROGRESS_METADATA_ONLY' || state === 'EVIDENCE_LINKED' || state === 'REPORT_LINKED') {
    return 'DEGRADED';
  }
  if (state === 'READY' || state === 'REQUESTED') return 'HEALTHY';
  return 'UNKNOWN';
}
