/**
 * Mobile Approval Runtime Foundation — state manager.
 */

import {
  getStoredMobileApprovalSession,
  appendMobileApprovalStateHistory,
  storeMobileApprovalSession,
  getStoredMobileApprovalStateHistory,
} from './mobile-approval-store.js';
import type { MobileApprovalState, MobileApprovalStateHistoryEntry } from './mobile-approval-types.js';
import { isValidMobileApprovalStateTransition } from './mobile-approval-types.js';

export function setMobileApprovalState(
  mobileApprovalId: string,
  newState: MobileApprovalState,
  force = false,
): { ok: boolean; previousState: MobileApprovalState | null; error?: string } {
  const session = getStoredMobileApprovalSession(mobileApprovalId);
  if (!session) {
    return { ok: false, previousState: null, error: `Mobile approval not found: ${mobileApprovalId}` };
  }

  const previousState = session.mobileApprovalState;
  if (!force && !isValidMobileApprovalStateTransition(previousState, newState)) {
    return { ok: false, previousState, error: `Invalid state transition: ${previousState} → ${newState}` };
  }

  storeMobileApprovalSession({
    ...session,
    mobileApprovalState: newState,
    mobileApprovalStatus: resolveStatusForState(newState),
    updatedAt: Date.now(),
  });

  appendMobileApprovalStateHistory({
    mobileApprovalId,
    previousState,
    newState,
    timestamp: Date.now(),
  });

  return { ok: true, previousState };
}

export function getMobileApprovalState(mobileApprovalId: string): MobileApprovalState | null {
  return getStoredMobileApprovalSession(mobileApprovalId)?.mobileApprovalState ?? null;
}

export function trackMobileApprovalStateHistory(mobileApprovalId: string): MobileApprovalStateHistoryEntry[] {
  return getStoredMobileApprovalStateHistory(mobileApprovalId);
}

function resolveStatusForState(
  state: MobileApprovalState,
): 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN' {
  if (state === 'COMPLETED' || state === 'APPROVED_STATE' || state === 'DECISION_RECORDED') {
    return 'HEALTHY';
  }
  if (state === 'FAILED' || state === 'REJECTED_STATE') return 'BLOCKED';
  if (state === 'WAITING_FOR_DECISION' || state === 'REQUEST_REGISTERED') return 'WAITING';
  if (state === 'READY' || state === 'INITIALIZING') return 'HEALTHY';
  return 'UNKNOWN';
}
