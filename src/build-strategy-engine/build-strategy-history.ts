/**
 * Build Strategy Engine — history tracking.
 */

import {
  nextBuildStrategyHistoryEntryId,
  storeBuildStrategyHistoryEntry,
  listStoredBuildStrategyHistoryEntries,
} from './build-strategy-store.js';
import type { BuildStrategyHistoryEntry } from './build-strategy-types.js';

export function recordBuildStrategyHistoryEntry(
  input: Omit<BuildStrategyHistoryEntry, 'entryId' | 'timestamp' | 'consumer'> & {
    consumer?: string | null;
  },
): BuildStrategyHistoryEntry {
  const entry: BuildStrategyHistoryEntry = {
    entryId: nextBuildStrategyHistoryEntryId(),
    buildStrategyId: input.buildStrategyId,
    category: input.category,
    summary: input.summary,
    timestamp: Date.now(),
    consumer: input.consumer ?? null,
    scopeUsed: input.scopeUsed ?? null,
  };
  storeBuildStrategyHistoryEntry(entry);
  return entry;
}

export function getBuildStrategyHistory(buildStrategyId: string): BuildStrategyHistoryEntry[] {
  return listStoredBuildStrategyHistoryEntries().filter((e) => e.buildStrategyId === buildStrategyId);
}

export function listBuildStrategyHistoryConsumers(): string[] {
  const consumers = new Set<string>();
  for (const entry of listStoredBuildStrategyHistoryEntries()) {
    if (entry.consumer) consumers.add(entry.consumer);
  }
  return [...consumers];
}
