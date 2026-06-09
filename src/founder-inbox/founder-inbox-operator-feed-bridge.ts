/**
 * Founder Inbox Foundation — Operator Feed bridge.
 */

import { getStoredInboxEntry, listStoredInboxEntries, storeInboxEntry } from './founder-inbox-store.js';
import { recordInboxHistoryEntry } from './founder-inbox-history.js';
import type { FounderInboxEntry, InboxOperatorFeedLink } from './founder-inbox-types.js';
import { FOUNDER_INBOX_FOUNDATION_OWNER_MODULE } from './founder-inbox-types.js';

export function linkInboxToOperatorFeed(inboxEntryId: string): InboxOperatorFeedLink | null {
  const entry = getStoredInboxEntry(inboxEntryId);
  if (!entry) return null;

  const link: InboxOperatorFeedLink = {
    feedAuthorityId: 'devpulse_v2_operator_feed_foundation',
    linkedAt: Date.now(),
    linkAuthority: FOUNDER_INBOX_FOUNDATION_OWNER_MODULE,
    mismatchDetected: false,
  };

  storeInboxEntry({
    ...entry,
    inboxOperatorFeedLink: link,
    updatedAt: Date.now(),
  });

  recordInboxHistoryEntry({
    inboxEntryId,
    category: 'OPERATOR_FEED',
    summary: 'Linked to operator feed',
    scopeUsed: link.feedAuthorityId,
  });

  return link;
}

export function getOperatorFeedForInbox(inboxEntryId: string): string | null {
  return getStoredInboxEntry(inboxEntryId)?.inboxOperatorFeedLink.feedAuthorityId ?? null;
}

export function listInboxEntriesByOperatorFeed(feedAuthorityId: string): FounderInboxEntry[] {
  return listStoredInboxEntries().filter(
    (e) => e.inboxOperatorFeedLink.feedAuthorityId === feedAuthorityId,
  );
}

export function detectInboxOperatorFeedMismatch(inboxEntryId: string): boolean {
  const entry = getStoredInboxEntry(inboxEntryId);
  if (!entry) return true;
  return entry.inboxOperatorFeedLink.mismatchDetected;
}
