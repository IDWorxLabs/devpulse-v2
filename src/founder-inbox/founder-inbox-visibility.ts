/**
 * Founder Inbox Foundation — visibility metadata.
 */

import { getStoredInboxEntry, storeInboxEntry } from './founder-inbox-store.js';
import { recordInboxHistoryEntry } from './founder-inbox-history.js';
import type { InboxCategory, InboxVisibility } from './founder-inbox-types.js';

export function buildDefaultInboxVisibility(category: InboxCategory): InboxVisibility {
  const mobile = category === 'MOBILE_INBOX';
  const cloud = category === 'CLOUD_INBOX';
  return {
    visibleInInbox: true,
    visibleOnMobile: mobile,
    visibleOnDesktop: !mobile,
    visibleOnCloud: cloud,
    visibleInOperatorFeed: category !== 'SYSTEM_INBOX',
    visibleInProjectVault: category === 'PROJECT_INBOX',
    visibilityReason: `Default visibility for ${category}`,
  };
}

export function registerInboxVisibility(
  inboxEntryId: string,
  visibility: InboxVisibility,
): InboxVisibility | null {
  const entry = getStoredInboxEntry(inboxEntryId);
  if (!entry) return null;
  storeInboxEntry({ ...entry, inboxVisibility: visibility, updatedAt: Date.now() });
  recordInboxHistoryEntry({
    inboxEntryId,
    category: 'VISIBILITY',
    summary: `Visibility updated: inbox=${visibility.visibleInInbox}`,
    scopeUsed: inboxEntryId,
  });
  return visibility;
}

export function getInboxVisibility(inboxEntryId: string): InboxVisibility | null {
  return getStoredInboxEntry(inboxEntryId)?.inboxVisibility ?? null;
}

export function validateInboxVisibility(visibility: InboxVisibility): boolean {
  return visibility.visibleInInbox || visibility.visibleInOperatorFeed;
}
