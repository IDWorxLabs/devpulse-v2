/**
 * Founder Inbox Foundation — state manager.
 */

import {
  getStoredInboxEntry,
  appendInboxStateHistory,
  storeInboxEntry,
  getStoredInboxStateHistory,
} from './founder-inbox-store.js';
import type { InboxState, InboxStateHistoryEntry } from './founder-inbox-types.js';
import { isValidInboxStateTransition } from './founder-inbox-types.js';

export function setInboxState(
  inboxEntryId: string,
  newState: InboxState,
  force = false,
): { ok: boolean; previousState: InboxState | null; error?: string } {
  const entry = getStoredInboxEntry(inboxEntryId);
  if (!entry) {
    return { ok: false, previousState: null, error: `Inbox entry not found: ${inboxEntryId}` };
  }

  const previousState = entry.inboxState;
  if (!force && !isValidInboxStateTransition(previousState, newState)) {
    return { ok: false, previousState, error: `Invalid state transition: ${previousState} → ${newState}` };
  }

  storeInboxEntry({
    ...entry,
    inboxState: newState,
    inboxStatus: resolveStatusForState(newState),
    updatedAt: Date.now(),
  });

  appendInboxStateHistory({
    inboxEntryId,
    previousState,
    newState,
    timestamp: Date.now(),
  });

  return { ok: true, previousState };
}

export function getInboxState(inboxEntryId: string): InboxState | null {
  return getStoredInboxEntry(inboxEntryId)?.inboxState ?? null;
}

export function trackInboxStateHistory(inboxEntryId: string): InboxStateHistoryEntry[] {
  return getStoredInboxStateHistory(inboxEntryId);
}

function resolveStatusForState(state: InboxState): 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'WAITING' | 'UNKNOWN' {
  if (state === 'ACKNOWLEDGED' || state === 'READ' || state === 'VISIBLE') return 'HEALTHY';
  if (state === 'FAILED') return 'BLOCKED';
  if (state === 'CREATED' || state === 'UNREAD') return 'WAITING';
  if (state === 'ARCHIVED' || state === 'HIDDEN') return 'DEGRADED';
  return 'UNKNOWN';
}
