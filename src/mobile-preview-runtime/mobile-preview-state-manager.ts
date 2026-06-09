/**
 * Mobile Preview Runtime Foundation — state manager.
 */

import {
  getStoredMobilePreviewSession,
  appendMobilePreviewStateHistory,
  storeMobilePreviewSession,
  getStoredMobilePreviewStateHistory,
} from './mobile-preview-store.js';
import type { MobilePreviewState, MobilePreviewStateHistoryEntry } from './mobile-preview-types.js';
import { isValidMobilePreviewStateTransition } from './mobile-preview-types.js';

export function setMobilePreviewState(
  mobilePreviewId: string,
  newState: MobilePreviewState,
  force = false,
): { ok: boolean; previousState: MobilePreviewState | null; error?: string } {
  const session = getStoredMobilePreviewSession(mobilePreviewId);
  if (!session) {
    return { ok: false, previousState: null, error: `Mobile preview not found: ${mobilePreviewId}` };
  }

  const previousState = session.mobilePreviewState;
  if (!force && !isValidMobilePreviewStateTransition(previousState, newState)) {
    return { ok: false, previousState, error: `Invalid state transition: ${previousState} → ${newState}` };
  }

  storeMobilePreviewSession({
    ...session,
    mobilePreviewState: newState,
    mobilePreviewStatus: resolveStatusForState(newState),
    updatedAt: Date.now(),
  });

  appendMobilePreviewStateHistory({
    mobilePreviewId,
    previousState,
    newState,
    timestamp: Date.now(),
  });

  return { ok: true, previousState };
}

export function getMobilePreviewState(mobilePreviewId: string): MobilePreviewState | null {
  return getStoredMobilePreviewSession(mobilePreviewId)?.mobilePreviewState ?? null;
}

export function trackMobilePreviewStateHistory(mobilePreviewId: string): MobilePreviewStateHistoryEntry[] {
  return getStoredMobilePreviewStateHistory(mobilePreviewId);
}

function resolveStatusForState(
  state: MobilePreviewState,
): 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN' {
  if (state === 'COMPLETED' || state === 'PREVIEW_READY' || state === 'MOBILE_PREVIEW_ALLOWED') {
    return 'HEALTHY';
  }
  if (state === 'FAILED' || state === 'MOBILE_PREVIEW_BLOCKED') return 'BLOCKED';
  if (state === 'PREVIEW_PENDING' || state === 'DESKTOP_RECOMMENDED') return 'WAITING';
  if (state === 'READY' || state === 'ELIGIBILITY_CHECKED' || state === 'SAFETY_CHECKED') return 'HEALTHY';
  return 'UNKNOWN';
}
