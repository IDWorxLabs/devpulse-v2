/**
 * Founder Inbox Foundation — acknowledgement metadata.
 */

import {
  getStoredInboxEntry,
  storeInboxEntry,
  nextInboxAcknowledgementId,
  nextInboxLifecycleEventId,
  storeInboxLifecycleEvent,
} from './founder-inbox-store.js';
import { setInboxState } from './founder-inbox-state-manager.js';
import { recordInboxHistoryEntry } from './founder-inbox-history.js';
import type { InboxAcknowledgement } from './founder-inbox-types.js';
import { FOUNDER_INBOX_FOUNDATION_OWNER_MODULE } from './founder-inbox-types.js';

export function acknowledgeInboxEntry(
  inboxEntryId: string,
  acknowledgedBy = FOUNDER_INBOX_FOUNDATION_OWNER_MODULE,
  reason = 'Founder acknowledged inbox entry',
): InboxAcknowledgement | null {
  const entry = getStoredInboxEntry(inboxEntryId);
  if (!entry) return null;

  const acknowledgement: InboxAcknowledgement = {
    acknowledgementId: nextInboxAcknowledgementId(),
    inboxEntryId,
    acknowledgedAt: Date.now(),
    acknowledgedBy,
    acknowledgementReason: reason,
    unacknowledged: false,
    unacknowledgedAt: null,
  };

  storeInboxEntry({
    ...entry,
    inboxAcknowledgement: acknowledgement,
    updatedAt: Date.now(),
  });
  setInboxState(inboxEntryId, 'ACKNOWLEDGED', true);

  storeInboxLifecycleEvent({
    eventId: nextInboxLifecycleEventId(),
    inboxEntryId,
    eventType: 'INBOX_ENTRY_ACKNOWLEDGED',
    previousState: entry.inboxState,
    newState: 'ACKNOWLEDGED',
    timestamp: Date.now(),
    sourceModule: FOUNDER_INBOX_FOUNDATION_OWNER_MODULE,
    notes: reason,
  });

  recordInboxHistoryEntry({
    inboxEntryId,
    category: 'ACKNOWLEDGEMENT',
    summary: `Acknowledged: ${reason}`,
    scopeUsed: acknowledgement.acknowledgementId,
  });

  return acknowledgement;
}

export function unacknowledgeInboxEntry(inboxEntryId: string): InboxAcknowledgement | null {
  const entry = getStoredInboxEntry(inboxEntryId);
  if (!entry?.inboxAcknowledgement) return null;

  const acknowledgement: InboxAcknowledgement = {
    ...entry.inboxAcknowledgement,
    unacknowledged: true,
    unacknowledgedAt: Date.now(),
  };

  storeInboxEntry({
    ...entry,
    inboxAcknowledgement: acknowledgement,
    updatedAt: Date.now(),
  });
  setInboxState(inboxEntryId, 'READ', true);

  recordInboxHistoryEntry({
    inboxEntryId,
    category: 'ACKNOWLEDGEMENT',
    summary: 'Unacknowledged inbox entry',
    scopeUsed: acknowledgement.acknowledgementId,
  });

  return acknowledgement;
}
