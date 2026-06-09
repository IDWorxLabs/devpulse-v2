/**
 * Founder Inbox Foundation — archive metadata.
 */

import {
  getStoredInboxEntry,
  storeInboxEntry,
  nextInboxArchiveId,
  nextInboxLifecycleEventId,
  storeInboxLifecycleEvent,
} from './founder-inbox-store.js';
import { setInboxState } from './founder-inbox-state-manager.js';
import { recordInboxHistoryEntry } from './founder-inbox-history.js';
import type { InboxArchiveRecord } from './founder-inbox-types.js';
import { FOUNDER_INBOX_FOUNDATION_OWNER_MODULE } from './founder-inbox-types.js';

export function archiveInboxEntry(
  inboxEntryId: string,
  archiveReason = 'Archived by founder',
  archivedBy = FOUNDER_INBOX_FOUNDATION_OWNER_MODULE,
): InboxArchiveRecord | null {
  const entry = getStoredInboxEntry(inboxEntryId);
  if (!entry) return null;

  const archive: InboxArchiveRecord = {
    archiveId: nextInboxArchiveId(),
    inboxEntryId,
    archivedAt: Date.now(),
    archiveReason,
    archivedBy,
    restored: false,
    restoredAt: null,
  };

  storeInboxEntry({
    ...entry,
    inboxArchive: archive,
    updatedAt: Date.now(),
  });
  setInboxState(inboxEntryId, 'ARCHIVED', true);

  storeInboxLifecycleEvent({
    eventId: nextInboxLifecycleEventId(),
    inboxEntryId,
    eventType: 'INBOX_ENTRY_ARCHIVED',
    previousState: entry.inboxState,
    newState: 'ARCHIVED',
    timestamp: Date.now(),
    sourceModule: FOUNDER_INBOX_FOUNDATION_OWNER_MODULE,
    notes: archiveReason,
  });

  recordInboxHistoryEntry({
    inboxEntryId,
    category: 'ARCHIVE',
    summary: `Archived: ${archiveReason}`,
    scopeUsed: archive.archiveId,
  });

  return archive;
}

export function restoreInboxEntry(inboxEntryId: string): InboxArchiveRecord | null {
  const entry = getStoredInboxEntry(inboxEntryId);
  if (!entry?.inboxArchive) return null;

  const archive: InboxArchiveRecord = {
    ...entry.inboxArchive,
    restored: true,
    restoredAt: Date.now(),
  };

  storeInboxEntry({
    ...entry,
    inboxArchive: archive,
    updatedAt: Date.now(),
  });
  setInboxState(inboxEntryId, 'VISIBLE', true);

  storeInboxLifecycleEvent({
    eventId: nextInboxLifecycleEventId(),
    inboxEntryId,
    eventType: 'INBOX_ENTRY_RESTORED',
    previousState: 'ARCHIVED',
    newState: 'VISIBLE',
    timestamp: Date.now(),
    sourceModule: FOUNDER_INBOX_FOUNDATION_OWNER_MODULE,
    notes: 'Inbox entry restored from archive',
  });

  recordInboxHistoryEntry({
    inboxEntryId,
    category: 'ARCHIVE',
    summary: 'Restored from archive',
    scopeUsed: archive.archiveId,
  });

  return archive;
}
