/**
 * Mobile Command Runtime Foundation — history tracking.
 */

import {
  nextMobileCommandHistoryEntryId,
  storeMobileCommandHistoryEntry,
  listStoredMobileCommandHistoryEntries,
} from './mobile-command-store.js';
import type { MobileCommandHistoryEntry } from './mobile-command-types.js';

export function recordMobileCommandHistoryEntry(input: {
  mobileCommandId: string;
  category: MobileCommandHistoryEntry['category'];
  summary: string;
  consumer?: string | null;
  scopeUsed?: string | null;
}): MobileCommandHistoryEntry {
  const entry: MobileCommandHistoryEntry = {
    entryId: nextMobileCommandHistoryEntryId(),
    mobileCommandId: input.mobileCommandId,
    category: input.category,
    summary: input.summary,
    timestamp: Date.now(),
    consumer: input.consumer ?? null,
    scopeUsed: input.scopeUsed ?? null,
  };
  storeMobileCommandHistoryEntry(entry);
  return entry;
}

export function getMobileCommandHistory(mobileCommandId?: string): MobileCommandHistoryEntry[] {
  const all = listStoredMobileCommandHistoryEntries();
  if (!mobileCommandId) return all;
  return all.filter((e) => e.mobileCommandId === mobileCommandId);
}

export function listMobileCommandHistoryConsumers(): string[] {
  const consumers = new Set<string>();
  for (const entry of listStoredMobileCommandHistoryEntries()) {
    if (entry.consumer) consumers.add(entry.consumer);
  }
  return [...consumers];
}
