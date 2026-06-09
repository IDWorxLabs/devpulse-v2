/**
 * Mobile Chat Runtime Foundation — state manager.
 */

import {
  getStoredMobileChatSession,
  appendMobileChatStateHistory,
  storeMobileChatSession,
  getStoredMobileChatStateHistory,
} from './mobile-chat-store.js';
import type { MobileChatState, MobileChatStateHistoryEntry } from './mobile-chat-types.js';
import { isValidMobileChatStateTransition } from './mobile-chat-types.js';

export function setMobileChatState(
  mobileChatId: string,
  newState: MobileChatState,
  force = false,
): { ok: boolean; previousState: MobileChatState | null; error?: string } {
  const session = getStoredMobileChatSession(mobileChatId);
  if (!session) {
    return { ok: false, previousState: null, error: `Mobile chat not found: ${mobileChatId}` };
  }

  const previousState = session.mobileChatState;
  if (!force && !isValidMobileChatStateTransition(previousState, newState)) {
    return { ok: false, previousState, error: `Invalid state transition: ${previousState} → ${newState}` };
  }

  storeMobileChatSession({
    ...session,
    mobileChatState: newState,
    mobileChatStatus: resolveStatusForState(newState),
    updatedAt: Date.now(),
  });

  appendMobileChatStateHistory({
    mobileChatId,
    previousState,
    newState,
    timestamp: Date.now(),
  });

  return { ok: true, previousState };
}

export function getMobileChatState(mobileChatId: string): MobileChatState | null {
  return getStoredMobileChatSession(mobileChatId)?.mobileChatState ?? null;
}

export function trackMobileChatStateHistory(mobileChatId: string): MobileChatStateHistoryEntry[] {
  return getStoredMobileChatStateHistory(mobileChatId);
}

function resolveStatusForState(state: MobileChatState): 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN' {
  if (state === 'COMPLETED' || state === 'RESPONSE_READY' || state === 'ACTION_ALLOWED') return 'HEALTHY';
  if (state === 'FAILED' || state === 'ACTION_BLOCKED') return 'BLOCKED';
  if (state === 'WAITING_FOR_APPROVAL' || state === 'RESPONSE_PENDING') return 'WAITING';
  if (state === 'READY' || state === 'CONTEXT_READY') return 'HEALTHY';
  return 'UNKNOWN';
}
