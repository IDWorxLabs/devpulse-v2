/**
 * Founder Inbox Foundation — history tracking.
 */

import {
  nextInboxHistoryEntryId,
  storeInboxHistoryEntry,
  listStoredInboxHistoryEntries,
} from './founder-inbox-store.js';
import type { InboxHistoryEntry } from './founder-inbox-types.js';

export function recordInboxHistoryEntry(
  input: Omit<InboxHistoryEntry, 'entryId' | 'timestamp' | 'consumer'> & {
    consumer?: string | null;
  },
): InboxHistoryEntry {
  const entry: InboxHistoryEntry = {
    entryId: nextInboxHistoryEntryId(),
    inboxEntryId: input.inboxEntryId,
    category: input.category,
    summary: input.summary,
    timestamp: Date.now(),
    consumer: input.consumer ?? null,
    scopeUsed: input.scopeUsed ?? null,
  };
  storeInboxHistoryEntry(entry);
  return entry;
}

export function getInboxHistory(inboxEntryId: string): InboxHistoryEntry[] {
  return listStoredInboxHistoryEntries().filter((e) => e.inboxEntryId === inboxEntryId);
}

export function listInboxHistoryConsumers(): string[] {
  const consumers = new Set<string>();
  for (const entry of listStoredInboxHistoryEntries()) {
    if (entry.consumer) consumers.add(entry.consumer);
  }
  return [...consumers];
}
