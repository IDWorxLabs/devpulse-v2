/**
 * Mobile Push Foundation — history tracking.
 */

import {
  nextPushHistoryEntryId,
  storePushHistoryEntry,
  listStoredPushHistoryEntries,
} from './mobile-push-store.js';
import type { PushHistoryEntry } from './mobile-push-types.js';

export function recordPushHistoryEntry(
  input: Omit<PushHistoryEntry, 'entryId' | 'timestamp' | 'consumer'> & {
    consumer?: string | null;
  },
): PushHistoryEntry {
  const entry: PushHistoryEntry = {
    entryId: nextPushHistoryEntryId(),
    pushId: input.pushId,
    category: input.category,
    summary: input.summary,
    timestamp: Date.now(),
    consumer: input.consumer ?? null,
    scopeUsed: input.scopeUsed ?? null,
  };
  storePushHistoryEntry(entry);
  return entry;
}

export function getPushHistory(pushId: string): PushHistoryEntry[] {
  return listStoredPushHistoryEntries().filter((e) => e.pushId === pushId);
}

export function listPushHistoryConsumers(): string[] {
  const consumers = new Set<string>();
  for (const entry of listStoredPushHistoryEntries()) {
    if (entry.consumer) consumers.add(entry.consumer);
  }
  return [...consumers];
}
