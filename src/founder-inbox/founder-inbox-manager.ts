/**
 * Founder Inbox Foundation — inbox entry manager (visualization only).
 */

import { getStoredInboxEntry, listStoredInboxEntries, storeInboxEntry } from './founder-inbox-store.js';
import { registerInboxOwnership } from './founder-inbox-ownership.js';
import type { FounderInboxEntry, InboxOwnership } from './founder-inbox-types.js';

export function createInboxEntry(entry: FounderInboxEntry): FounderInboxEntry {
  storeInboxEntry(entry);
  registerInboxOwnership(entry.inboxEntryId, entry.inboxOwnership);
  return entry;
}

export function getInboxEntry(inboxEntryId: string): FounderInboxEntry | null {
  return getStoredInboxEntry(inboxEntryId);
}

export function listInboxEntries(): FounderInboxEntry[] {
  return listStoredInboxEntries();
}

export function trackInboxMetadata(
  inboxEntryId: string,
  metadata: Partial<FounderInboxEntry['inboxMetadata']>,
): FounderInboxEntry | null {
  const entry = getStoredInboxEntry(inboxEntryId);
  if (!entry) return null;

  const updated: FounderInboxEntry = {
    ...entry,
    inboxMetadata: { ...entry.inboxMetadata, ...metadata },
    updatedAt: Date.now(),
  };
  storeInboxEntry(updated);
  return updated;
}

export function trackInboxOwnership(
  inboxEntryId: string,
  ownership: Partial<InboxOwnership>,
): FounderInboxEntry | null {
  const entry = getStoredInboxEntry(inboxEntryId);
  if (!entry) return null;

  const updatedOwnership = { ...entry.inboxOwnership, ...ownership };
  registerInboxOwnership(inboxEntryId, updatedOwnership);

  const updated: FounderInboxEntry = {
    ...entry,
    inboxOwnership: updatedOwnership,
    updatedAt: Date.now(),
  };
  storeInboxEntry(updated);
  return updated;
}
