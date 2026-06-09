/**
 * Founder Inbox Foundation — Cloud Runtime bridge.
 */

import { getRuntime } from '../cloud-runtime/index.js';
import { getStoredInboxEntry, listStoredInboxEntries, storeInboxEntry } from './founder-inbox-store.js';
import { recordInboxHistoryEntry } from './founder-inbox-history.js';
import type { FounderInboxEntry, InboxCloudLink } from './founder-inbox-types.js';
import { FOUNDER_INBOX_FOUNDATION_OWNER_MODULE } from './founder-inbox-types.js';

export function linkInboxToCloud(inboxEntryId: string, runtimeId: string): InboxCloudLink | null {
  const entry = getStoredInboxEntry(inboxEntryId);
  const runtime = getRuntime(runtimeId);
  if (!entry || !runtime) return null;

  const mismatch = runtime.runtimeOwner.projectId !== entry.inboxOwnership.projectId;
  const link: InboxCloudLink = {
    runtimeId,
    linkedAt: Date.now(),
    linkAuthority: FOUNDER_INBOX_FOUNDATION_OWNER_MODULE,
    mismatchDetected: mismatch,
  };

  storeInboxEntry({
    ...entry,
    inboxCloudLink: link,
    updatedAt: Date.now(),
  });

  recordInboxHistoryEntry({
    inboxEntryId,
    category: 'CLOUD',
    summary: `Linked to cloud runtime ${runtimeId}${mismatch ? ' — MISMATCH' : ''}`,
    scopeUsed: runtimeId,
  });

  return link;
}

export function getCloudForInbox(inboxEntryId: string): string | null {
  return getStoredInboxEntry(inboxEntryId)?.inboxCloudLink.runtimeId ?? null;
}

export function listInboxEntriesByCloud(runtimeId: string): FounderInboxEntry[] {
  return listStoredInboxEntries().filter((e) => e.inboxCloudLink.runtimeId === runtimeId);
}

export function detectInboxCloudMismatch(inboxEntryId: string): boolean {
  const entry = getStoredInboxEntry(inboxEntryId);
  if (!entry) return true;
  const runtime = getRuntime(entry.inboxCloudLink.runtimeId);
  if (!runtime) return true;
  return (
    runtime.runtimeOwner.projectId !== entry.inboxOwnership.projectId ||
    entry.inboxCloudLink.mismatchDetected
  );
}
