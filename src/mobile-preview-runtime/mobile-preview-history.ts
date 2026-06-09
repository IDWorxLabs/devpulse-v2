/**
 * Mobile Preview Runtime Foundation — history tracking.
 */

import {
  nextMobilePreviewHistoryEntryId,
  storeMobilePreviewHistoryEntry,
  listStoredMobilePreviewHistoryEntries,
} from './mobile-preview-store.js';
import type { MobilePreviewHistoryEntry } from './mobile-preview-types.js';

export function recordMobilePreviewHistoryEntry(input: {
  mobilePreviewId: string;
  category: MobilePreviewHistoryEntry['category'];
  summary: string;
  consumer?: string | null;
  scopeUsed?: string | null;
}): MobilePreviewHistoryEntry {
  const entry: MobilePreviewHistoryEntry = {
    entryId: nextMobilePreviewHistoryEntryId(),
    mobilePreviewId: input.mobilePreviewId,
    category: input.category,
    summary: input.summary,
    timestamp: Date.now(),
    consumer: input.consumer ?? null,
    scopeUsed: input.scopeUsed ?? null,
  };
  storeMobilePreviewHistoryEntry(entry);
  return entry;
}

export function getMobilePreviewHistory(mobilePreviewId?: string): MobilePreviewHistoryEntry[] {
  const all = listStoredMobilePreviewHistoryEntries();
  if (!mobilePreviewId) return all;
  return all.filter((e) => e.mobilePreviewId === mobilePreviewId);
}

export function listMobilePreviewHistoryConsumers(): string[] {
  const consumers = new Set<string>();
  for (const entry of listStoredMobilePreviewHistoryEntries()) {
    if (entry.consumer) consumers.add(entry.consumer);
  }
  return [...consumers];
}
