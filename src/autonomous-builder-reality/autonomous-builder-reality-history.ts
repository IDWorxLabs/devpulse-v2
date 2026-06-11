/**
 * Autonomous Builder Reality — bounded assessment history.
 */

import { MAX_HISTORY_ENTRIES } from './autonomous-builder-reality-bounds.js';
import type { BuilderRealityHistoryEntry } from './autonomous-builder-reality-types.js';

const history: BuilderRealityHistoryEntry[] = [];

let historyCounter = 0;

export function resetAutonomousBuilderRealityHistoryForTests(): void {
  history.length = 0;
  historyCounter = 0;
}

function nextHistoryId(): string {
  historyCounter += 1;
  return `builder-history-${historyCounter}`;
}

export function recordBuilderRealityHistory(
  entry: Omit<BuilderRealityHistoryEntry, 'historyId' | 'recordedAt'>,
): BuilderRealityHistoryEntry {
  const record: BuilderRealityHistoryEntry = {
    ...entry,
    historyId: nextHistoryId(),
    recordedAt: Date.now(),
  };
  history.unshift(record);
  if (history.length > MAX_HISTORY_ENTRIES) {
    history.length = MAX_HISTORY_ENTRIES;
  }
  return record;
}

export function listBuilderRealityHistory(): BuilderRealityHistoryEntry[] {
  return [...history];
}

export function getBuilderRealityHistoryCount(): number {
  return history.length;
}
