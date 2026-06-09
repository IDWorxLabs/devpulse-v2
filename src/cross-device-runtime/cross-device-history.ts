/**
 * Cross Device Runtime Foundation — history tracking.
 */

import {
  nextCrossDeviceHistoryEntryId,
  storeCrossDeviceHistoryEntry,
  listStoredCrossDeviceHistoryEntries,
} from './cross-device-store.js';
import type { CrossDeviceHistoryEntry } from './cross-device-types.js';

export function recordCrossDeviceHistoryEntry(input: {
  crossDeviceId: string;
  category: CrossDeviceHistoryEntry['category'];
  summary: string;
  consumer?: string | null;
  scopeUsed?: string | null;
}): CrossDeviceHistoryEntry {
  const entry: CrossDeviceHistoryEntry = {
    entryId: nextCrossDeviceHistoryEntryId(),
    crossDeviceId: input.crossDeviceId,
    category: input.category,
    summary: input.summary,
    timestamp: Date.now(),
    consumer: input.consumer ?? null,
    scopeUsed: input.scopeUsed ?? null,
  };
  storeCrossDeviceHistoryEntry(entry);
  return entry;
}

export function getCrossDeviceHistory(crossDeviceId?: string): CrossDeviceHistoryEntry[] {
  const all = listStoredCrossDeviceHistoryEntries();
  if (!crossDeviceId) return all;
  return all.filter((e) => e.crossDeviceId === crossDeviceId);
}

export function listCrossDeviceHistoryConsumers(): string[] {
  const consumers = new Set<string>();
  for (const entry of listStoredCrossDeviceHistoryEntries()) {
    if (entry.consumer) consumers.add(entry.consumer);
  }
  return [...consumers];
}
