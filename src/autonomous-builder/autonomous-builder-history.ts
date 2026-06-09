/**
 * Autonomous Builder Foundation — history tracking.
 */

import {
  nextAutonomousBuildHistoryEntryId,
  storeAutonomousBuildHistoryEntry,
  listStoredAutonomousBuildHistoryEntries,
} from './autonomous-builder-store.js';
import type { AutonomousBuildHistoryEntry } from './autonomous-builder-types.js';

export function recordAutonomousBuildHistoryEntry(
  input: Omit<AutonomousBuildHistoryEntry, 'entryId' | 'timestamp' | 'consumer'> & {
    consumer?: string | null;
  },
): AutonomousBuildHistoryEntry {
  const entry: AutonomousBuildHistoryEntry = {
    entryId: nextAutonomousBuildHistoryEntryId(),
    autonomousBuildId: input.autonomousBuildId,
    category: input.category,
    summary: input.summary,
    timestamp: Date.now(),
    consumer: input.consumer ?? null,
    scopeUsed: input.scopeUsed ?? null,
  };
  storeAutonomousBuildHistoryEntry(entry);
  return entry;
}

export function getAutonomousBuildHistory(autonomousBuildId: string): AutonomousBuildHistoryEntry[] {
  return listStoredAutonomousBuildHistoryEntries().filter((e) => e.autonomousBuildId === autonomousBuildId);
}

export function listAutonomousBuildHistoryConsumers(): string[] {
  const consumers = new Set<string>();
  for (const entry of listStoredAutonomousBuildHistoryEntries()) {
    if (entry.consumer) consumers.add(entry.consumer);
  }
  return [...consumers];
}
