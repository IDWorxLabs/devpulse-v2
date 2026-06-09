/**
 * Mobile Chat Runtime Foundation — history tracking.
 */

import {
  nextMobileChatHistoryEntryId,
  storeMobileChatHistoryEntry,
  listStoredMobileChatHistoryEntries,
} from './mobile-chat-store.js';
import type { MobileChatHistoryEntry } from './mobile-chat-types.js';

export function recordMobileChatHistoryEntry(input: {
  mobileChatId: string;
  category: MobileChatHistoryEntry['category'];
  summary: string;
  consumer?: string | null;
  scopeUsed?: string | null;
}): MobileChatHistoryEntry {
  const entry: MobileChatHistoryEntry = {
    entryId: nextMobileChatHistoryEntryId(),
    mobileChatId: input.mobileChatId,
    category: input.category,
    summary: input.summary,
    timestamp: Date.now(),
    consumer: input.consumer ?? null,
    scopeUsed: input.scopeUsed ?? null,
  };
  storeMobileChatHistoryEntry(entry);
  return entry;
}

export function getMobileChatHistory(mobileChatId?: string): MobileChatHistoryEntry[] {
  const all = listStoredMobileChatHistoryEntries();
  if (!mobileChatId) return all;
  return all.filter((e) => e.mobileChatId === mobileChatId);
}

export function listMobileChatHistoryConsumers(): string[] {
  const consumers = new Set<string>();
  for (const entry of listStoredMobileChatHistoryEntries()) {
    if (entry.consumer) consumers.add(entry.consumer);
  }
  return [...consumers];
}
